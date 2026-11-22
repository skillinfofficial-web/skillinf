'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './quiz.module.css';

/* ── Types ──────────────────────────────────────────────────────────────── */
interface QuizQuestion {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  timerSeconds: number;
}

type Stage = 'gate' | 'quiz' | 'result';

const PASS_THRESHOLD = 60; // percent

/* ── Helpers ────────────────────────────────────────────────────────────── */
function fmtTimer(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/* ════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═════════════════════════════════════════════════════════════════════════ */
export default function QuizPage() {
  const params  = useParams();
  const router  = useRouter();
  const domain  = decodeURIComponent(params.domain as string);
  const weekNum = parseInt(params.week as string, 10);

  /* ── Fetch state ───────────────────────────────────────────────────── */
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [fetchErr,  setFetchErr]  = useState('');

  /* ── Quiz flow state ───────────────────────────────────────────────── */
  const [stage,     setStage]     = useState<Stage>('gate');
  const [current,   setCurrent]   = useState(0);
  const [answers,   setAnswers]   = useState<(number | null)[]>([]);
  const [selected,  setSelected]  = useState<number | null>(null);
  const [timeLeft,  setTimeLeft]  = useState(0);
  const [score,     setScore]     = useState(0);
  const [fsWarning, setFsWarning] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Fetch questions ───────────────────────────────────────────────── */
  useEffect(() => {
    if (!domain || isNaN(weekNum)) { setFetchErr('Invalid quiz link.'); setLoading(false); return; }
    fetch(`/api/course?domain=${encodeURIComponent(domain)}`)
      .then(r => r.json())
      .then(d => {
        if (!d.success) { setFetchErr(d.message || 'Course not found.'); return; }
        const week = (d.weeks as { week: number; quizQuestions?: QuizQuestion[] }[])
          ?.find(w => w.week === weekNum);
        if (!week) { setFetchErr(`Week ${weekNum} not found.`); return; }
        const qs = week.quizQuestions ?? [];
        if (qs.length === 0) { setFetchErr('No quiz questions have been added for this week yet.'); return; }
        setQuestions(qs);
        setAnswers(new Array(qs.length).fill(null));
      })
      .catch(() => setFetchErr('Failed to load quiz. Please try again.'))
      .finally(() => setLoading(false));
  }, [domain, weekNum]);

  /* ── Fullscreen change listener ────────────────────────────────────── */
  useEffect(() => {
    const onFsChange = () => {
      if (stage === 'quiz' && !document.fullscreenElement) {
        setFsWarning(true);
      } else {
        setFsWarning(false);
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [stage]);

  /* ── Per-question timer ────────────────────────────────────────────── */
  const startTimer = useCallback((secs: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(secs);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Auto-advance: treat as unanswered (null already)
          setAnswers(ans => {
            const copy = [...ans];
            // keep whatever was selected or null
            return copy;
          });
          goNext(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Go to question ────────────────────────────────────────────────── */
  const goToQuestion = useCallback((idx: number, qs: QuizQuestion[]) => {
    setCurrent(idx);
    setSelected(null);
    startTimer(qs[idx]?.timerSeconds ?? 30);
  }, [startTimer]);

  /* ── Begin quiz ────────────────────────────────────────────────────── */
  const beginQuiz = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch {/* fullscreen may be denied; continue anyway */}
    setStage('quiz');
    goToQuestion(0, questions);
  };

  /* ── Next / Submit ─────────────────────────────────────────────────── */
  const goNext = useCallback((autoAdvance = false) => {
    if (timerRef.current) clearInterval(timerRef.current);

    setAnswers(prev => {
      const copy = [...prev];
      if (!autoAdvance && selected !== null) copy[current] = selected;
      return copy;
    });

    setQuestions(qs => {
      const nextIdx = current + 1;
      if (nextIdx < qs.length) {
        setCurrent(nextIdx);
        setSelected(null);
        startTimer(qs[nextIdx]?.timerSeconds ?? 30);
      } else {
        // Calculate result using latest answers
        setAnswers(finalAnswers => {
          const correctCount = finalAnswers.filter((a, i) => a === qs[i].correctIndex).length;
          const pct = Math.round((correctCount / qs.length) * 100);
          setScore(pct);
          if (pct >= PASS_THRESHOLD) {
            localStorage.setItem(`quiz_passed_${domain}_week_${weekNum}`, '1');
          }
          setStage('result');
          try { document.exitFullscreen(); } catch {/* ignore */}
          return finalAnswers;
        });
      }
      return qs;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, selected, domain, weekNum, startTimer]);

  /* ── Retry ─────────────────────────────────────────────────────────── */
  const retry = async () => {
    setAnswers(new Array(questions.length).fill(null));
    setScore(0);
    setStage('quiz');
    try { await document.documentElement.requestFullscreen(); } catch {/* ok */}
    goToQuestion(0, questions);
  };

  /* ── Cleanup ───────────────────────────────────────────────────────── */
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  /* ════════════════════════════════════════════════════════════════════
     RENDER: Loading / Error
  ═══════════════════════════════════════════════════════════════════ */
  if (loading) return (
    <div className={styles.shell}>
      <div className={styles.center}>
        <div className={styles.spinner} />
        <p className={styles.centerTxt}>Loading quiz…</p>
      </div>
    </div>
  );

  if (fetchErr || questions.length === 0) return (
    <div className={styles.shell}>
      <div className={styles.center}>
        <h2 className={styles.errTitle}>Quiz Unavailable</h2>
        <p className={styles.errMsg}>{fetchErr || 'No questions found.'}</p>
        <button onClick={() => router.push('/dashboard')} className={styles.dashBtn}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  const q = questions[current];
  const isLast = current === questions.length - 1;
  const correctCount = answers.filter((a, i) => a === questions[i].correctIndex).length;
  const passed = score >= PASS_THRESHOLD;

  /* ════════════════════════════════════════════════════════════════════
     STAGE: Gate (Rules)
  ═══════════════════════════════════════════════════════════════════ */
  if (stage === 'gate') return (
    <div className={styles.shell}>
      <div className={styles.gateWrap}>
        <div className={styles.gateCard}>
          <Image src="/skillinf-logo.png" alt="Skillinf" width={130} height={44} className={styles.gateLogo} />
          <h1 className={styles.gateTitle}>Quiz Rules</h1>
          <p className={styles.gateSub}>{domain} — Week {weekNum} Quiz</p>

          <ul className={styles.ruleList}>
            <li className={styles.ruleItem}>
              <span className={styles.ruleDot} />
              Do not leave or close this page during the quiz.
            </li>
            <li className={styles.ruleItem}>
              <span className={styles.ruleDot} />
              Do not minimize the browser window.
            </li>
            <li className={styles.ruleItem}>
              <span className={styles.ruleDot} />
              Do not switch to another tab or window.
            </li>
            <li className={styles.ruleItem}>
              <span className={styles.ruleDot} />
              Each question has its own time limit. Answer before time runs out.
            </li>
            <li className={styles.ruleItem}>
              <span className={styles.ruleDot} />
              You need <strong>60% or above</strong> to pass the quiz.
            </li>
          </ul>

          <p className={styles.gateNote}>
            {questions.length} question{questions.length !== 1 ? 's' : ''} total. The quiz will open in fullscreen.
          </p>

          <button className={styles.acceptBtn} onClick={beginQuiz}>
            Accept and Begin Quiz
          </button>
          <button className={styles.backLink} onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════════════
     STAGE: Quiz
  ═══════════════════════════════════════════════════════════════════ */
  if (stage === 'quiz') return (
    <div className={styles.shell}>

      {/* Topbar */}
      <header className={styles.topbar}>
        <span className={styles.topTitle}>{domain} — Week {weekNum} Quiz</span>
        <span className={styles.topProgress}>{current + 1} / {questions.length}</span>
      </header>

      {/* Fullscreen warning overlay */}
      {fsWarning && (
        <div className={styles.fsOverlay}>
          <div className={styles.fsCard}>
            <p className={styles.fsTitle}>Fullscreen Required</p>
            <p className={styles.fsSub}>Please return to fullscreen to continue the quiz.</p>
            <button
              className={styles.fsResumeBtn}
              onClick={() => document.documentElement.requestFullscreen().then(() => setFsWarning(false)).catch(() => setFsWarning(false))}
            >
              Resume Fullscreen
            </button>
          </div>
        </div>
      )}

      <main className={styles.quizBody}>

        {/* Timer */}
        <div className={`${styles.timerBox} ${timeLeft <= 5 ? styles.timerDanger : ''}`}>
          <span className={styles.timerLabel}>Time left</span>
          <span className={styles.timerVal}>{fmtTimer(timeLeft)}</span>
        </div>

        {/* Question card */}
        <div className={styles.questionCard}>
          <p className={styles.qMeta}>Question {current + 1} of {questions.length}</p>
          <p className={styles.qText}>{q.question}</p>

          <div className={styles.optionList}>
            {(['A', 'B', 'C', 'D'] as const).map((letter, idx) => (
              <button
                key={idx}
                className={`${styles.optionBtn} ${selected === idx ? styles.optionSelected : ''}`}
                onClick={() => setSelected(idx)}
              >
                <span className={styles.optionLetter}>{letter}</span>
                <span className={styles.optionText}>{q.options[idx]}</span>
              </button>
            ))}
          </div>

          <div className={styles.navRow}>
            {isLast ? (
              <button
                className={styles.submitQuizBtn}
                onClick={() => goNext(false)}
              >
                Save and Submit
              </button>
            ) : (
              <button
                className={styles.nextBtn}
                onClick={() => goNext(false)}
                disabled={selected === null}
              >
                Next →
              </button>
            )}
          </div>
        </div>

      </main>
    </div>
  );

  /* ════════════════════════════════════════════════════════════════════
     STAGE: Result
  ═══════════════════════════════════════════════════════════════════ */
  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <span className={styles.topTitle}>{domain} — Week {weekNum} Quiz Result</span>
      </header>

      <main className={styles.resultBody}>
        <div className={`${styles.resultCard} ${passed ? styles.resultPass : styles.resultFail}`}>

          <div className={`${styles.scoreCircle} ${passed ? styles.scoreCirclePass : styles.scoreCircleFail}`}>
            <span className={styles.scorePct}>{score}%</span>
          </div>

          <h1 className={styles.resultTitle}>
            {passed ? 'Quiz Passed!' : 'Quiz Not Passed'}
          </h1>
          <p className={styles.resultSub}>
            You answered <strong>{correctCount}</strong> out of <strong>{questions.length}</strong> questions correctly.
          </p>
          {!passed && (
            <p className={styles.resultNote}>
              You need <strong>60%</strong> to pass. Keep practicing and try again!
            </p>
          )}
          {passed && (
            <p className={styles.resultNote}>
              Congratulations! Project Guidance for this week is now unlocked on your dashboard.
            </p>
          )}

          <div className={styles.resultBtns}>
            {!passed && (
              <button className={styles.retryBtn} onClick={retry}>
                Retry Now
              </button>
            )}
            <button className={styles.dashBackBtn} onClick={() => router.push('/dashboard')}>
              {passed ? 'Back to Dashboard' : 'Back to Dashboard'}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
