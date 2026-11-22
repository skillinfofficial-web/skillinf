'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
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

function fmtTimer(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/* ════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   Uses refs for mutable quiz state so timer callbacks never go stale.
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

  /* ── Render-driving state ──────────────────────────────────────────── */
  const [stage,     setStage]    = useState<Stage>('gate');
  const [current,   setCurrent]  = useState(0);       // current question index
  const [selected,  setSelected] = useState<number | null>(null); // chosen option
  const [timeLeft,  setTimeLeft] = useState(0);
  const [score,     setScore]    = useState(0);
  const [fsWarning, setFsWarning] = useState(false);

  /* ── Mutable refs (always current, safe inside setInterval) ────────── */
  const questionsRef = useRef<QuizQuestion[]>([]);
  const answersRef   = useRef<(number | null)[]>([]);
  const currentRef   = useRef(0);
  const selectedRef  = useRef<number | null>(null);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const domainRef    = useRef(domain);
  const weekNumRef   = useRef(weekNum);

  // Keep refs in sync with render state
  useEffect(() => { domainRef.current  = domain;  }, [domain]);
  useEffect(() => { weekNumRef.current = weekNum; }, [weekNum]);

  /* ── Sync selected to ref ──────────────────────────────────────────── */
  useEffect(() => { selectedRef.current = selected; }, [selected]);

  /* ── Fetch questions ───────────────────────────────────────────────── */
  useEffect(() => {
    if (!domain || isNaN(weekNum)) {
      setFetchErr('Invalid quiz link.');
      setLoading(false);
      return;
    }
    fetch(`/api/course?domain=${encodeURIComponent(domain)}`)
      .then(r => r.json())
      .then(d => {
        if (!d.success) { setFetchErr(d.message || 'Course not found.'); return; }
        const week = (d.weeks as { week: number; quizQuestions?: QuizQuestion[] }[])
          ?.find(w => w.week === weekNum);
        if (!week) { setFetchErr(`Week ${weekNum} not found.`); return; }
        const qs = week.quizQuestions ?? [];
        if (qs.length === 0) {
          setFetchErr('No quiz questions have been added for this week yet.');
          return;
        }
        questionsRef.current = qs;
        answersRef.current   = new Array(qs.length).fill(null);
        setQuestions(qs);
      })
      .catch(() => setFetchErr('Failed to load quiz. Please try again.'))
      .finally(() => setLoading(false));
  }, [domain, weekNum]);

  /* ── Fullscreen change listener ────────────────────────────────────── */
  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) setFsWarning(true);
      else setFsWarning(false);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  /* ── Advance to next question or finish — stable, uses refs ────────── */
  const advance = useCallback((saveSelected: boolean) => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    const qs  = questionsRef.current;
    const idx = currentRef.current;

    // Record answer
    if (saveSelected && selectedRef.current !== null) {
      answersRef.current[idx] = selectedRef.current;
    }

    const nextIdx = idx + 1;

    if (nextIdx < qs.length) {
      // Go to next question
      currentRef.current = nextIdx;
      setCurrent(nextIdx);
      setSelected(null);
      selectedRef.current = null;
      startQuestion(nextIdx);
    } else {
      // All questions answered — compute result
      const answers = answersRef.current;
      const correct = answers.filter((a, i) => a === qs[i].correctIndex).length;
      const pct     = Math.round((correct / qs.length) * 100);

      if (pct >= PASS_THRESHOLD) {
        localStorage.setItem(
          `quiz_passed_${domainRef.current}_week_${weekNumRef.current}`,
          '1'
        );
      }

      setScore(pct);
      setStage('result');
      try { document.exitFullscreen(); } catch { /* ok */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Start a question's timer — stable, calls advance via ref ──────── */
  const startQuestion = useCallback((idx: number) => {
    const qs = questionsRef.current;
    const secs = qs[idx]?.timerSeconds ?? 30;
    setTimeLeft(secs);

    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    let remaining = secs;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        timerRef.current = null;
        // Auto-advance without saving (time expired)
        advance(false);
      }
    }, 1000);
  }, [advance]);

  /* ── Begin quiz ────────────────────────────────────────────────────── */
  const beginQuiz = async () => {
    try { await document.documentElement.requestFullscreen(); } catch { /* ok */ }
    currentRef.current  = 0;
    answersRef.current  = new Array(questionsRef.current.length).fill(null);
    setStage('quiz');
    setCurrent(0);
    setSelected(null);
    selectedRef.current = null;
    startQuestion(0);
  };

  /* ── Next button click ─────────────────────────────────────────────── */
  const handleNext = () => advance(true);

  /* ── Retry ─────────────────────────────────────────────────────────── */
  const retry = async () => {
    currentRef.current  = 0;
    answersRef.current  = new Array(questionsRef.current.length).fill(null);
    setScore(0);
    setStage('quiz');
    setCurrent(0);
    setSelected(null);
    selectedRef.current = null;
    try { await document.documentElement.requestFullscreen(); } catch { /* ok */ }
    startQuestion(0);
  };

  /* ── Cleanup ───────────────────────────────────────────────────────── */
  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

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

  const q      = questions[current];
  const isLast = current === questions.length - 1;
  const passed = score >= PASS_THRESHOLD;
  const correctCount = answersRef.current.filter((a, i) => a === questions[i].correctIndex).length;

  /* ════════════════════════════════════════════════════════════════════
     STAGE: Gate (Rules)
  ═══════════════════════════════════════════════════════════════════ */
  if (stage === 'gate') return (
    <div className={styles.shell}>
      <div className={styles.gateWrap}>
        <div className={styles.gateCard}>
          <Image
            src="/skillinf-logo.png"
            alt="Skillinf"
            width={130}
            height={44}
            className={styles.gateLogo}
          />
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
            {questions.length} question{questions.length !== 1 ? 's' : ''} total.
            The quiz will open in fullscreen.
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
              onClick={() =>
                document.documentElement
                  .requestFullscreen()
                  .then(() => setFsWarning(false))
                  .catch(() => setFsWarning(false))
              }
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
              <button className={styles.submitQuizBtn} onClick={handleNext}>
                Save and Submit
              </button>
            ) : (
              <button
                className={styles.nextBtn}
                onClick={handleNext}
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
        <span className={styles.topTitle}>{domain} — Week {weekNum} · Quiz Result</span>
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
            You answered <strong>{correctCount}</strong> out of{' '}
            <strong>{questions.length}</strong> questions correctly.
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
              Back to Dashboard
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
