// Seed data for 10 internship domains × 4 steps each.
// Inserted once into the `courseDomains` MongoDB collection.

export interface CourseStep {
  step:        number;
  title:       string;
  description: string;
  tutorialUrl: string;
  task:        string;
}

export interface CourseDomain {
  domain: string;
  steps:  CourseStep[];
}

export const COURSE_SEEDS: CourseDomain[] = [
  {
    domain: 'AI & Machine Learning',
    steps: [
      {
        step: 1,
        title: 'Introduction to Machine Learning',
        description: 'Understand the core concepts of supervised, unsupervised, and reinforcement learning. Explore real-world use-cases and the ML development workflow.',
        tutorialUrl: 'https://www.youtube.com/watch?v=NWONeJKn6kc',
        task: 'Write a 500-word summary explaining the difference between supervised and unsupervised learning with two real-world examples each. Upload to Google Drive.',
      },
      {
        step: 2,
        title: 'Data Preprocessing & Feature Engineering',
        description: 'Learn to clean raw datasets, handle missing values, encode categorical variables, and engineer features that improve model accuracy.',
        tutorialUrl: 'https://www.youtube.com/watch?v=7eh4d6sabA0',
        task: 'Download the Titanic dataset, perform complete preprocessing (handle nulls, encode categories, normalise numeric columns), and upload your Jupyter notebook to Google Drive.',
      },
      {
        step: 3,
        title: 'Model Building & Training',
        description: 'Build and train classification and regression models using scikit-learn. Understand hyperparameter tuning and cross-validation.',
        tutorialUrl: 'https://www.youtube.com/watch?v=pqNCD_5r0IU',
        task: 'Train a Random Forest classifier on the Iris dataset, tune at least 2 hyperparameters, and document your accuracy results. Upload your notebook link.',
      },
      {
        step: 4,
        title: 'Model Evaluation & Mini Project',
        description: 'Evaluate models using precision, recall, F1-score, and ROC-AUC. Build and present a complete mini ML project end-to-end.',
        tutorialUrl: 'https://www.youtube.com/watch?v=85dtiMz9tSo',
        task: 'Build a complete ML project on a dataset of your choice: preprocessing → model → evaluation → brief report. Share your Google Drive link.',
      },
    ],
  },
  {
    domain: 'Data Science',
    steps: [
      {
        step: 1,
        title: 'Data Analysis Fundamentals',
        description: 'Get hands-on with Python Pandas and NumPy. Learn to load, explore, and summarise structured datasets.',
        tutorialUrl: 'https://www.youtube.com/watch?v=vmEHCJofslg',
        task: 'Load any public CSV dataset using Pandas, compute summary statistics, identify missing values, and write a 300-word analysis. Upload your notebook.',
      },
      {
        step: 2,
        title: 'Statistical Analysis & Visualisation',
        description: 'Apply descriptive and inferential statistics. Create compelling visualisations with Matplotlib and Seaborn.',
        tutorialUrl: 'https://www.youtube.com/watch?v=a9UrKTVEeZA',
        task: 'Using the same or a new dataset, create 5 different charts (bar, line, scatter, histogram, heatmap) with clear titles and labels. Share the notebook.',
      },
      {
        step: 3,
        title: 'Machine Learning Basics for Data Science',
        description: 'Introduction to regression and classification models. Understand train/test splits and model evaluation metrics.',
        tutorialUrl: 'https://www.youtube.com/watch?v=i_LwzRVP7bg',
        task: 'Build a linear regression model to predict a numeric target in any dataset. Report RMSE and R² scores. Upload your notebook.',
      },
      {
        step: 4,
        title: 'End-to-End Data Science Project',
        description: 'Apply everything: data collection, cleaning, analysis, modelling, and presenting insights through a professional report.',
        tutorialUrl: 'https://www.youtube.com/watch?v=xx0rLc6u0iY',
        task: 'Complete a full data science project (your choice of domain/dataset). Include EDA, at least one model, key insights, and a brief 1-page report. Share Drive link.',
      },
    ],
  },
  {
    domain: 'Web Development',
    steps: [
      {
        step: 1,
        title: 'HTML & CSS Fundamentals',
        description: 'Build the foundations of the web — semantic HTML5 structure, CSS box model, flexbox, grid layout, and responsive design basics.',
        tutorialUrl: 'https://www.youtube.com/watch?v=mU6anWqZJcc',
        task: 'Build a responsive personal profile page using only HTML and CSS (no frameworks). Must include header, about section, skills, and footer. Share GitHub/Drive link.',
      },
      {
        step: 2,
        title: 'JavaScript Essentials',
        description: 'Master modern JavaScript — ES6+, DOM manipulation, events, fetch API, and async/await patterns.',
        tutorialUrl: 'https://www.youtube.com/watch?v=PkZNo7MFNFg',
        task: 'Build a to-do list app with add, complete, and delete functionality using vanilla JavaScript. Share your hosted/GitHub link.',
      },
      {
        step: 3,
        title: 'Responsive Design & UI Frameworks',
        description: 'Learn responsive breakpoints, CSS variables, and build professional UIs. Introduction to a CSS framework.',
        tutorialUrl: 'https://www.youtube.com/watch?v=4sosXZsdy-s',
        task: 'Convert your profile page into a fully responsive design working on mobile (375px), tablet (768px), and desktop (1280px). Share link.',
      },
      {
        step: 4,
        title: 'Multi-page Website Project',
        description: 'Build a complete multi-page website combining HTML, CSS, and JavaScript. Apply navigation, forms, and dynamic content.',
        tutorialUrl: 'https://www.youtube.com/watch?v=3PHXvlpOkf4',
        task: 'Build a 3-page website (Home, About, Contact with working form validation) and deploy it to GitHub Pages or Netlify. Share live URL.',
      },
    ],
  },
  {
    domain: 'Full Stack Development',
    steps: [
      {
        step: 1,
        title: 'Frontend Foundations',
        description: 'Build a solid frontend with HTML, CSS, and JavaScript. Understand component thinking and client-side rendering.',
        tutorialUrl: 'https://www.youtube.com/watch?v=mU6anWqZJcc',
        task: 'Build a responsive dashboard UI with a sidebar, header, and 3 stat cards using only HTML/CSS/JS. Share your GitHub/Drive link.',
      },
      {
        step: 2,
        title: 'Backend Development & REST APIs',
        description: 'Build REST APIs using Node.js and Express. Learn routing, middleware, request/response handling.',
        tutorialUrl: 'https://www.youtube.com/watch?v=fBNz5xF-Kx4',
        task: 'Build a simple CRUD REST API for a "tasks" resource with GET, POST, PUT, DELETE endpoints. Test with Postman and share your project link.',
      },
      {
        step: 3,
        title: 'Database Integration with MongoDB',
        description: 'Connect your API to MongoDB. Understand CRUD operations, schema design, and data modelling.',
        tutorialUrl: 'https://www.youtube.com/watch?v=-56x56UppqQ',
        task: 'Connect your tasks API to MongoDB Atlas. Persist data across restarts. Share your GitHub repo.',
      },
      {
        step: 4,
        title: 'Full Stack Application',
        description: 'Combine frontend, backend, and database into a complete working application. Deploy it.',
        tutorialUrl: 'https://www.youtube.com/watch?v=mrHNSanmqQ4',
        task: 'Build a full stack task management app with frontend + Node/Express backend + MongoDB. Deploy anywhere and share live URL + GitHub link.',
      },
    ],
  },
  {
    domain: 'Python Development',
    steps: [
      {
        step: 1,
        title: 'Python Fundamentals',
        description: 'Variables, data types, control flow, functions, and error handling in Python.',
        tutorialUrl: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc',
        task: 'Write 10 Python programs covering: variables, loops, functions, lists, and dictionaries. Upload a single .py file or notebook to Drive.',
      },
      {
        step: 2,
        title: 'Object-Oriented Python',
        description: 'Classes, objects, inheritance, encapsulation, and polymorphism in Python.',
        tutorialUrl: 'https://www.youtube.com/watch?v=JeznW_7DlB0',
        task: 'Build a Bank Account system using OOP with classes for Account, SavingsAccount, and CurrentAccount. Share the code.',
      },
      {
        step: 3,
        title: 'Python Libraries & File Handling',
        description: 'Work with os, pathlib, json, csv, requests library, and external APIs.',
        tutorialUrl: 'https://www.youtube.com/watch?v=U1aUteSg2Kw',
        task: 'Write a script that fetches data from a public API (e.g. weather, currency), processes it, and saves results to a CSV file. Share the link.',
      },
      {
        step: 4,
        title: 'Python Application Project',
        description: 'Build a complete Python application — CLI tool, automation script, or mini web app.',
        tutorialUrl: 'https://www.youtube.com/watch?v=8ext9G7xspg',
        task: 'Build a Python project of your choice (expense tracker, quiz app, file organiser, etc.). Must use OOP + file handling. Share GitHub/Drive link.',
      },
    ],
  },
  {
    domain: 'Data Analytics',
    steps: [
      {
        step: 1,
        title: 'Analytics Fundamentals',
        description: 'Understand descriptive analytics, KPIs, metrics, and the analytics thinking process.',
        tutorialUrl: 'https://www.youtube.com/watch?v=yZvFH7B6gKI',
        task: 'Choose any business scenario (e-commerce, restaurant, school). Define 5 KPIs relevant to it and explain why each metric matters. Upload a PDF/doc to Drive.',
      },
      {
        step: 2,
        title: 'Excel & Google Sheets for Analytics',
        description: 'Master pivot tables, VLOOKUP, conditional formatting, charts, and dashboards in spreadsheets.',
        tutorialUrl: 'https://www.youtube.com/watch?v=K5n6k8WIHCE',
        task: 'Build a sales analytics dashboard in Google Sheets using real or sample data. Must include 3 pivot tables and 3 charts. Share the sheet (view-only link).',
      },
      {
        step: 3,
        title: 'SQL for Data Analysis',
        description: 'Write SQL queries for aggregation, joins, subqueries, and window functions.',
        tutorialUrl: 'https://www.youtube.com/watch?v=HXV3zeQKqGY',
        task: 'Complete 15 SQL exercises covering SELECT, WHERE, GROUP BY, JOIN, and a window function. Use SQLiteOnline or similar. Share screenshot/Drive link.',
      },
      {
        step: 4,
        title: 'Analytics Dashboard Project',
        description: 'Build an end-to-end analytics dashboard using Google Looker Studio or Tableau Public.',
        tutorialUrl: 'https://www.youtube.com/watch?v=6_J6pq_3l7M',
        task: 'Build a Looker Studio / Tableau Public dashboard on a dataset of your choice with at least 5 visualisations and key insights. Share the public URL.',
      },
    ],
  },
  {
    domain: 'Cloud Computing',
    steps: [
      {
        step: 1,
        title: 'Cloud Computing Fundamentals',
        description: 'Understand IaaS, PaaS, SaaS, cloud deployment models, and the major cloud providers (AWS, Azure, GCP).',
        tutorialUrl: 'https://www.youtube.com/watch?v=M988_fsOSWo',
        task: 'Write a 600-word comparison of AWS, Azure, and GCP covering services, pricing, and best use cases. Upload to Drive.',
      },
      {
        step: 2,
        title: 'AWS Core Services',
        description: 'Hands-on with EC2, S3, IAM, and Lambda using the AWS Free Tier.',
        tutorialUrl: 'https://www.youtube.com/watch?v=ulprqHHWlng',
        task: 'Create an AWS Free Tier account, launch an EC2 instance, create an S3 bucket, and upload a file. Document with screenshots and share via Drive.',
      },
      {
        step: 3,
        title: 'Cloud Architecture & Security',
        description: 'Design scalable cloud architectures. Understand security groups, VPCs, and IAM best practices.',
        tutorialUrl: 'https://www.youtube.com/watch?v=a9__D53WsUs',
        task: 'Design a 3-tier cloud architecture diagram for an e-commerce application. Identify the services, security layers, and estimated cost. Share as PDF.',
      },
      {
        step: 4,
        title: 'Cloud Deployment Project',
        description: 'Deploy a real application to the cloud using cloud services.',
        tutorialUrl: 'https://www.youtube.com/watch?v=qNIniDftAcU',
        task: 'Deploy a simple web application (can be a static site) to AWS S3 + CloudFront or any free cloud platform. Share the live URL.',
      },
    ],
  },
  {
    domain: 'Cybersecurity',
    steps: [
      {
        step: 1,
        title: 'Cybersecurity Fundamentals',
        description: 'Core concepts: CIA Triad, threat landscape, types of attacks, and security frameworks.',
        tutorialUrl: 'https://www.youtube.com/watch?v=hXSFdwIOfnE',
        task: 'Write a 600-word report on any recent cybersecurity breach (last 2 years). Cover: what happened, how it was exploited, and prevention measures. Upload to Drive.',
      },
      {
        step: 2,
        title: 'Network Security & Protocols',
        description: 'TCP/IP, DNS, HTTP/HTTPS, firewalls, VPNs, and common network attacks.',
        tutorialUrl: 'https://www.youtube.com/watch?v=xpXhudbsrr8',
        task: 'Use Wireshark (free) to capture network traffic for 5 minutes and identify at least 5 different protocols. Document findings with screenshots. Upload to Drive.',
      },
      {
        step: 3,
        title: 'Ethical Hacking Basics',
        description: 'Penetration testing methodology, reconnaissance, scanning, and legal/ethical boundaries.',
        tutorialUrl: 'https://www.youtube.com/watch?v=3Kq1MIfTWCE',
        task: 'Use TryHackMe or HackTheBox (free rooms) to complete one beginner-level room. Document what you learned and share your TryHackMe profile link.',
      },
      {
        step: 4,
        title: 'Security Assessment Project',
        description: 'Perform a security audit on a practice environment and write a professional assessment report.',
        tutorialUrl: 'https://www.youtube.com/watch?v=WnN6dbos5u8',
        task: 'Complete a full beginner CTF challenge on TryHackMe or PicoCTF. Write a 1-page report covering: approach, tools used, vulnerabilities found, recommendations. Share Drive link.',
      },
    ],
  },
  {
    domain: 'UI/UX Design',
    steps: [
      {
        step: 1,
        title: 'Design Principles & Fundamentals',
        description: 'Visual design principles: hierarchy, contrast, alignment, proximity, colour theory, and typography.',
        tutorialUrl: 'https://www.youtube.com/watch?v=_Hp_dI0__qY',
        task: 'Analyse 3 popular websites/apps (e.g. Swiggy, Zomato, Amazon) for their UI design. For each: identify 2 good and 2 bad design decisions. Upload a PDF to Drive.',
      },
      {
        step: 2,
        title: 'User Research & Wireframing',
        description: 'UX research methods, user personas, user journeys, and low-fidelity wireframing.',
        tutorialUrl: 'https://www.youtube.com/watch?v=qpH7-KFWZRI',
        task: 'Create a user persona and user journey map for a food delivery app. Then create low-fidelity wireframes for 3 key screens (Home, Menu, Checkout). Share Drive link.',
      },
      {
        step: 3,
        title: 'High-Fidelity Design with Figma',
        description: 'Build professional UI designs in Figma — components, design systems, interactions, and prototypes.',
        tutorialUrl: 'https://www.youtube.com/watch?v=jwCmIBJ8Jtc',
        task: 'Design 3 high-fidelity screens in Figma for an app of your choice (mobile or web). Apply consistent colours, typography, and spacing. Share the Figma view link.',
      },
      {
        step: 4,
        title: 'Complete UI/UX Case Study',
        description: 'Combine research, wireframing, and high-fidelity design into a professional case study.',
        tutorialUrl: 'https://www.youtube.com/watch?v=kbZejnPXyLM',
        task: 'Create a complete UX case study for one app: problem statement → research → wireframes → hi-fi design → prototype link. Upload a Figma link + brief PDF summary.',
      },
    ],
  },
  {
    domain: 'Automation',
    steps: [
      {
        step: 1,
        title: 'Automation Fundamentals',
        description: 'Understand automation concepts, use-cases in business, and an introduction to Python for automation.',
        tutorialUrl: 'https://www.youtube.com/watch?v=s8XjEuplx_U',
        task: 'List 10 real-world tasks that can be automated in a business/college environment. For each, explain what tool/language you would use and why. Upload to Drive.',
      },
      {
        step: 2,
        title: 'Python Automation Scripts',
        description: 'Automate repetitive tasks: file management, email sending, report generation with Python.',
        tutorialUrl: 'https://www.youtube.com/watch?v=dZLyfbSQPXI',
        task: 'Write 3 Python automation scripts: (1) organise files by extension, (2) rename files in bulk, (3) generate a text report. Share a Drive link with all scripts.',
      },
      {
        step: 3,
        title: 'Web Scraping & API Automation',
        description: 'Scrape websites with BeautifulSoup and Playwright. Automate workflows using external APIs.',
        tutorialUrl: 'https://www.youtube.com/watch?v=XVv6mJpFOb0',
        task: 'Build a web scraper that collects data from any public website (e.g. news headlines, product prices) and saves it to a CSV. Share code + sample output via Drive.',
      },
      {
        step: 4,
        title: 'Automation Project',
        description: 'Build a complete automation project that solves a real problem.',
        tutorialUrl: 'https://www.youtube.com/watch?v=s8XjEuplx_U',
        task: 'Build an automation project that combines file handling + API/web interaction. Examples: auto-download weather reports, auto-rename images, auto-email report generator. Share Drive link.',
      },
    ],
  },
];
