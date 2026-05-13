/**
 * Seed script — 10 high-quality anonymized resumes (5 SWE + 5 AI/Data)
 * Run: npx tsx scripts/seedResumes.ts
 */

import mongoose from "mongoose";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ─── TopResume Schema ─────────────────────────────────────────────────────────
const TopResumeSchema = new mongoose.Schema({
  anonymizedContent: String,
  embedding: [Number],
  score: Number,
  roleType: String,
  skills: [String],
}, { timestamps: { createdAt: true, updatedAt: false } });

const TopResume = mongoose.models.TopResume || mongoose.model("TopResume", TopResumeSchema);

// ─── Resume Data ──────────────────────────────────────────────────────────────

const resumes = [

  // ══════════════════════════════════════════════════════════
  //  SWE 1 — Full Stack Engineer (React / Node.js / AWS)
  // ══════════════════════════════════════════════════════════
  {
    roleType: "Full Stack Developer",
    score: 96,
    skills: ["React", "Node.js", "TypeScript", "AWS", "PostgreSQL", "Docker", "REST APIs", "CI/CD"],
    content: `[NAME]
[LOCATION] | [EMAIL] | [PHONE] | [LINKEDIN] | [GITHUB]

SUMMARY
Full Stack Software Engineer with 3 years of experience building scalable web applications using React, Node.js, and AWS. Delivered products used by 500,000+ users across fintech and SaaS domains. Strong focus on performance optimization and clean architecture.

EDUCATION
[UNIVERSITY] | B.Tech — Computer Science | CGPA: 8.9/10 | 2019 – 2023

SKILLS
Languages: JavaScript, TypeScript, Python, SQL
Frontend: React, Next.js, Redux, Tailwind CSS, HTML5, CSS3
Backend: Node.js, Express.js, GraphQL, REST APIs
Cloud & DevOps: AWS (EC2, S3, Lambda, RDS), Docker, Kubernetes, GitHub Actions, CI/CD
Databases: PostgreSQL, MongoDB, Redis
Tools: Git, Jest, Webpack, Figma

EXPERIENCE
Software Engineer — [COMPANY] | Jun 2023 – Present
- Architected and shipped a real-time dashboard serving 50,000 daily active users, reducing page load time by 62% through lazy loading and Redis caching
- Designed a microservices-based backend with Node.js and Express handling 10,000 requests/second with 99.97% uptime
- Led migration from REST to GraphQL reducing over-fetching by 45% and improving API response times by 38%
- Built an automated CI/CD pipeline using GitHub Actions and Docker, cutting deployment time from 45 minutes to 8 minutes
- Collaborated with product and design teams to ship 12 new features per quarter, consistently meeting sprint goals

Software Engineer Intern — [COMPANY] | Jan 2023 – May 2023
- Developed 15 reusable React components used across 3 product lines, reducing UI development time by 30%
- Optimized PostgreSQL queries using indexes and query planning, reducing average query time from 800ms to 120ms
- Wrote 200+ unit and integration tests with Jest, achieving 87% code coverage

PROJECTS
E-Commerce Platform | React | Node.js | Stripe | PostgreSQL
- Built a full-stack e-commerce platform with cart, checkout, and payment processing via Stripe; handled 1,000 concurrent users in load testing
- Implemented JWT authentication and role-based access control for admin, vendor, and customer roles

Real-Time Chat App | React | WebSocket | Node.js | Redis
- Engineered real-time messaging with WebSocket supporting 5,000 concurrent connections; used Redis pub/sub for horizontal scaling

CERTIFICATIONS
- AWS Certified Developer – Associate
- Meta Front-End Developer Certificate`
  },

  // ══════════════════════════════════════════════════════════
  //  SWE 2 — Backend Engineer (Java / Spring Boot)
  // ══════════════════════════════════════════════════════════
  {
    roleType: "Backend Developer",
    score: 94,
    skills: ["Java", "Spring Boot", "Microservices", "Kafka", "PostgreSQL", "Docker", "Kubernetes", "REST APIs"],
    content: `[NAME]
[LOCATION] | [EMAIL] | [PHONE] | [LINKEDIN] | [GITHUB]

SUMMARY
Backend Software Engineer with expertise in Java, Spring Boot, and distributed systems. Built and scaled microservices processing 2M+ transactions daily at a payment tech company. Strong foundation in system design, database optimization, and event-driven architecture.

EDUCATION
[UNIVERSITY] | B.E — Information Technology | CGPA: 9.1/10 | 2018 – 2022

SKILLS
Languages: Java, Python, SQL, Bash
Backend: Spring Boot, Spring Security, Hibernate, JPA, REST APIs, gRPC
Messaging: Apache Kafka, RabbitMQ
Databases: PostgreSQL, MySQL, Redis, Elasticsearch
DevOps: Docker, Kubernetes, Jenkins, AWS (ECS, RDS, SQS)
Tools: Git, Maven, Gradle, JUnit, Mockito, Postman

EXPERIENCE
Senior Backend Engineer — [COMPANY] | Jul 2022 – Present
- Designed and implemented a payment processing microservice handling 2M+ daily transactions with 99.99% availability using Spring Boot and Kafka
- Reduced transaction latency by 55% by introducing an async processing pipeline with Kafka and optimizing Hibernate queries
- Led a team of 4 engineers to migrate a monolith to 8 microservices, improving deployment frequency from monthly to daily
- Implemented distributed tracing with Zipkin and centralized logging with ELK stack, reducing mean time to debug by 70%
- Built a fraud detection pipeline integrating ML model inference, processing 500K events/day with sub-50ms latency

Backend Engineer Intern — [COMPANY] | Jan 2022 – Jun 2022
- Developed 6 REST API endpoints for user onboarding flow, serving 10,000 new users per month
- Wrote comprehensive JUnit and Mockito tests achieving 92% coverage for the billing module
- Reduced database load by 40% by implementing Redis caching for frequently accessed reference data

PROJECTS
Distributed Task Scheduler | Java | Spring Boot | PostgreSQL | Docker
- Built a cron-based distributed task scheduler supporting 10,000 concurrent jobs with leader election via ZooKeeper

Inventory Management API | Spring Boot | Kafka | PostgreSQL
- Developed event-sourced inventory system with Kafka ensuring eventual consistency across 5 warehouse services

CERTIFICATIONS
- Oracle Certified Professional Java SE 11
- AWS Certified Solutions Architect – Associate`
  },

  // ══════════════════════════════════════════════════════════
  //  SWE 3 — Frontend Engineer (React / TypeScript / Next.js)
  // ══════════════════════════════════════════════════════════
  {
    roleType: "Frontend Developer",
    score: 93,
    skills: ["React", "TypeScript", "Next.js", "Redux", "Tailwind CSS", "Jest", "Webpack", "GraphQL"],
    content: `[NAME]
[LOCATION] | [EMAIL] | [PHONE] | [LINKEDIN] | [GITHUB]

SUMMARY
Frontend Engineer specializing in React and TypeScript with 2.5 years of experience delivering high-performance, accessible web applications. Improved Core Web Vitals scores by 40%+ across multiple products. Passionate about design systems and developer experience.

EDUCATION
[UNIVERSITY] | B.Tech — Computer Science | CGPA: 8.7/10 | 2020 – 2024

SKILLS
Languages: TypeScript, JavaScript, HTML5, CSS3
Frameworks: React, Next.js, Vue.js, Remix
State Management: Redux Toolkit, Zustand, React Query, Context API
Styling: Tailwind CSS, Styled Components, CSS Modules, Framer Motion
Testing: Jest, React Testing Library, Playwright, Cypress
Tools: Webpack, Vite, Storybook, Figma, GraphQL, REST APIs

EXPERIENCE
Frontend Engineer — [COMPANY] | Aug 2023 – Present
- Built and maintained a component library of 60+ reusable React components used across 4 product teams, reducing UI development time by 35%
- Improved Largest Contentful Paint from 4.2s to 1.8s and Time to Interactive from 6.1s to 2.3s using code splitting, image optimization, and SSR with Next.js
- Implemented end-to-end testing with Playwright covering 80 critical user flows, catching 15 production bugs before release
- Migrated 40,000+ lines of JavaScript to TypeScript with zero runtime regressions, improving IDE experience and reducing bugs by 28%
- Mentored 2 junior engineers through code reviews and pair programming sessions

Frontend Developer Intern — [COMPANY] | Jan 2023 – Jul 2023
- Developed 8 responsive landing pages achieving Lighthouse performance scores above 95 for all pages
- Integrated GraphQL APIs using Apollo Client, reducing unnecessary data fetching by 50%
- Built an accessible date-range picker component meeting WCAG 2.1 AA standards, used by 200,000 users

PROJECTS
Design System | React | TypeScript | Storybook | Chromatic
- Created and documented a design system with 45 components, reducing new page development time by 4 hours per page

Portfolio CMS | Next.js | TypeScript | Tailwind CSS | Contentful
- Built a server-rendered CMS-powered portfolio with ISR, achieving 100/100 Lighthouse score and sub-1s load time

CERTIFICATIONS
- Meta React Developer Certificate
- Google UX Design Certificate`
  },

  // ══════════════════════════════════════════════════════════
  //  SWE 4 — Systems / Backend (Go / Kubernetes / gRPC)
  // ══════════════════════════════════════════════════════════
  {
    roleType: "Systems Engineer",
    score: 95,
    skills: ["Go", "Kubernetes", "gRPC", "Prometheus", "PostgreSQL", "Linux", "Docker", "Distributed Systems"],
    content: `[NAME]
[LOCATION] | [EMAIL] | [PHONE] | [LINKEDIN] | [GITHUB]

SUMMARY
Systems Software Engineer with deep expertise in Go, distributed systems, and cloud-native infrastructure. Built high-throughput services processing 5M+ events/day. Experienced in Kubernetes operator development and observability stack design.

EDUCATION
[UNIVERSITY] | B.Tech — Computer Science and Engineering | CGPA: 9.3/10 | 2018 – 2022

SKILLS
Languages: Go, Python, C++, Bash, SQL
Backend: gRPC, Protocol Buffers, REST APIs, GraphQL
Infrastructure: Kubernetes, Docker, Helm, Terraform, Istio
Observability: Prometheus, Grafana, Jaeger, OpenTelemetry, ELK Stack
Databases: PostgreSQL, CockroachDB, Redis, Cassandra
Cloud: AWS (EKS, EC2, S3, CloudWatch), GCP (GKE)

EXPERIENCE
Software Engineer II — [COMPANY] | Jun 2022 – Present
- Developed a high-throughput event ingestion service in Go processing 5M events/day with P99 latency under 10ms using gRPC streaming
- Built a custom Kubernetes operator in Go managing 200+ database clusters, reducing manual ops toil by 80%
- Designed a distributed rate-limiting system using Redis and Lua scripts enforcing quotas across 50 microservices with sub-1ms overhead
- Reduced infrastructure costs by 35% by optimizing Kubernetes resource requests and implementing Horizontal Pod Autoscaler policies
- Established a centralized observability platform with Prometheus, Grafana, and Jaeger adopted by 8 engineering teams

Systems Engineer Intern — [COMPANY] | Jan 2022 – May 2022
- Contributed to an open-source Kubernetes admission webhook in Go with 800+ GitHub stars
- Automated infrastructure provisioning with Terraform, reducing new environment setup from 3 days to 45 minutes
- Profiled and optimized Go service memory allocations, reducing GC pause times by 60%

PROJECTS
Distributed Cache | Go | gRPC | Consistent Hashing
- Implemented a distributed in-memory cache with consistent hashing, supporting 100,000 get/set operations per second

Log Aggregation Pipeline | Go | Kafka | Elasticsearch
- Built a log pipeline ingesting 1GB/min of structured logs with exactly-once processing semantics

CERTIFICATIONS
- Certified Kubernetes Administrator (CKA)
- HashiCorp Terraform Associate`
  },

  // ══════════════════════════════════════════════════════════
  //  SWE 5 — Full Stack (Python / Django / React)
  // ══════════════════════════════════════════════════════════
  {
    roleType: "Full Stack Developer",
    score: 91,
    skills: ["Python", "Django", "React", "PostgreSQL", "Celery", "Redis", "AWS", "REST APIs"],
    content: `[NAME]
[LOCATION] | [EMAIL] | [PHONE] | [LINKEDIN] | [GITHUB]

SUMMARY
Full Stack Developer with 2 years of experience building SaaS products using Python/Django and React. Delivered 3 end-to-end products from MVP to production. Strong background in API design, background task processing, and cloud deployment.

EDUCATION
[UNIVERSITY] | B.E — Information Science | CGPA: 8.5/10 | 2020 – 2024

SKILLS
Languages: Python, JavaScript, TypeScript, SQL
Backend: Django, Django REST Framework, FastAPI, Celery, WebSockets
Frontend: React, Next.js, Redux, Tailwind CSS
Databases: PostgreSQL, MySQL, Redis, SQLite
DevOps: AWS (EC2, S3, RDS, SES), Docker, Nginx, GitHub Actions
Tools: Git, Pytest, Postman, Sentry, Stripe API

EXPERIENCE
Full Stack Developer — [COMPANY] | Aug 2023 – Present
- Built a multi-tenant SaaS billing platform using Django and React, onboarding 300+ business customers in 6 months
- Designed a background job processing system with Celery and Redis handling 50,000 email notifications/day with 99.5% delivery rate
- Reduced API response time by 48% through N+1 query elimination with Django select_related and prefetch_related
- Integrated Stripe payment gateway supporting subscriptions, one-time charges, and invoicing with 99.9% transaction success rate
- Deployed application on AWS with auto-scaling EC2, RDS Multi-AZ, and CloudFront CDN, achieving 99.95% uptime

Software Developer Intern — [COMPANY] | Feb 2023 – Jul 2023
- Developed RESTful APIs for a healthcare management system serving 5,000 daily users using Django REST Framework
- Built a PDF report generation feature using WeasyPrint processing 2,000 reports/day
- Wrote 150 Pytest test cases achieving 85% coverage for the core models and API views

PROJECTS
Job Board Platform | Django | React | PostgreSQL | Elasticsearch
- Built a job board with full-text search via Elasticsearch, resume parsing, and email alerts for 1,000 active users

Task Management API | FastAPI | PostgreSQL | Docker
- Developed a RESTful task management API with JWT auth, team collaboration, and file attachments, deployed with Docker Compose

CERTIFICATIONS
- AWS Certified Cloud Practitioner
- Django REST Framework Advanced — Udemy`
  },

  // ══════════════════════════════════════════════════════════
  //  AI/Data 1 — ML Engineer (PyTorch / MLOps)
  // ══════════════════════════════════════════════════════════
  {
    roleType: "AI/ML Engineer",
    score: 97,
    skills: ["PyTorch", "Python", "MLflow", "Kubernetes", "TensorFlow", "CUDA", "Transformers", "MLOps"],
    content: `[NAME]
[LOCATION] | [EMAIL] | [PHONE] | [LINKEDIN] | [GITHUB]

SUMMARY
Machine Learning Engineer with 3 years of experience designing and deploying production ML systems. Built models serving 1M+ predictions/day. Deep expertise in deep learning, MLOps, and model optimization. Published 2 papers at top-tier ML conferences.

EDUCATION
[UNIVERSITY] | M.Tech — Artificial Intelligence | CGPA: 9.4/10 | 2021 – 2023
[UNIVERSITY] | B.Tech — Computer Science | CGPA: 9.0/10 | 2017 – 2021

SKILLS
ML / DL: PyTorch, TensorFlow, Keras, Transformers (HuggingFace), scikit-learn, XGBoost, LightGBM
MLOps: MLflow, Weights & Biases, Kubeflow, Airflow, DVC, BentoML
Languages: Python, C++, CUDA, SQL, Bash
Infrastructure: Kubernetes, Docker, AWS SageMaker, GCP Vertex AI
Data: Pandas, NumPy, Spark, Dask, Apache Kafka
NLP: BERT, GPT fine-tuning, LangChain, RAG, vector databases (Pinecone, Weaviate)

EXPERIENCE
Machine Learning Engineer — [COMPANY] | Jul 2023 – Present
- Trained and deployed a transformer-based recommendation model serving 1M+ predictions/day with P95 latency of 35ms on GPU-backed Kubernetes pods
- Reduced model inference cost by 60% through quantization (INT8), ONNX conversion, and TensorRT optimization
- Built an end-to-end MLOps pipeline with MLflow, DVC, and Airflow automating data validation, training, evaluation, and deployment
- Fine-tuned LLaMA-2-13B on domain-specific data using LoRA/QLoRA, achieving 18% improvement on internal benchmarks with 4x less compute
- Led A/B testing framework comparing ML model variants, generating $2.3M in incremental revenue from improved recommendations

ML Research Engineer — [COMPANY] | Jun 2021 – Jun 2023
- Developed a real-time fraud detection model using gradient boosting achieving 97.8% AUC with sub-100ms inference
- Designed a distributed training pipeline on AWS SageMaker reducing training time for image classification from 14 hours to 2.5 hours
- Published paper on efficient attention mechanisms at NeurIPS workshop, cited 45 times

PROJECTS
RAG Document QA System | LangChain | FAISS | OpenAI | FastAPI
- Built a production RAG pipeline over 50,000 documents with semantic chunking, hybrid retrieval, and re-ranking achieving 91% answer accuracy

Image Segmentation System | PyTorch | U-Net | CUDA
- Trained U-Net for medical image segmentation achieving 0.94 Dice coefficient on benchmark dataset

CERTIFICATIONS
- AWS Certified Machine Learning – Specialty
- Deep Learning Specialization — deeplearning.ai (5 courses)`
  },

  // ══════════════════════════════════════════════════════════
  //  AI/Data 2 — Data Scientist (sklearn / XGBoost / A/B)
  // ══════════════════════════════════════════════════════════
  {
    roleType: "Data Scientist",
    score: 93,
    skills: ["Python", "scikit-learn", "XGBoost", "SQL", "Pandas", "A/B Testing", "Tableau", "Statistics"],
    content: `[NAME]
[LOCATION] | [EMAIL] | [PHONE] | [LINKEDIN] | [GITHUB]

SUMMARY
Data Scientist with 3 years of experience driving business decisions through statistical modeling and ML. Delivered models that generated $5M+ in measurable business impact. Expert in experimentation, churn prediction, pricing optimization, and customer segmentation.

EDUCATION
[UNIVERSITY] | M.Sc — Data Science | CGPA: 9.2/10 | 2020 – 2022
[UNIVERSITY] | B.Tech — Mathematics and Computing | CGPA: 8.8/10 | 2016 – 2020

SKILLS
ML & Stats: scikit-learn, XGBoost, LightGBM, CatBoost, statsmodels, SciPy
Languages: Python, R, SQL, Scala
Data Engineering: PySpark, Pandas, NumPy, Dask, Apache Airflow
Visualization: Tableau, Power BI, Matplotlib, Seaborn, Plotly
Experimentation: A/B testing, multi-armed bandits, causal inference, propensity scoring
Cloud: AWS (S3, Redshift, SageMaker), GCP (BigQuery, Dataflow)
NLP: NLTK, spaCy, sentiment analysis, topic modeling

EXPERIENCE
Senior Data Scientist — [COMPANY] | May 2022 – Present
- Built a customer churn prediction model (XGBoost) with 89% recall, enabling proactive retention campaigns saving $3.2M annually
- Designed and analyzed 40+ A/B experiments using power analysis and Bayesian statistics, generating $1.8M incremental revenue
- Developed a dynamic pricing model using gradient boosting increasing average order value by 12% across 2M monthly transactions
- Built automated data pipelines with Apache Airflow processing 500GB/day of event data for real-time feature generation
- Presented insights to C-suite driving strategic decisions for 3 new product launches

Data Scientist — [COMPANY] | Jun 2020 – Apr 2022
- Developed customer segmentation model using K-Means and RFM analysis, identifying 5 high-value segments representing 65% of revenue
- Created a demand forecasting model reducing inventory overstocking by 22% and stockouts by 31%
- Built self-serve analytics dashboards in Tableau used by 150+ business stakeholders weekly

PROJECTS
Fraud Detection System | Python | XGBoost | Imbalanced-learn
- Built fraud classifier achieving 96.5% precision at 5% false positive rate using SMOTE oversampling and threshold optimization

Price Elasticity Analysis | Python | CausalML | Econometrics
- Modeled price elasticity using causal inference methods, informing pricing strategy that increased margin by 8%

CERTIFICATIONS
- Google Professional Data Engineer
- Databricks Certified Associate Developer for Apache Spark`
  },

  // ══════════════════════════════════════════════════════════
  //  AI/Data 3 — LLM / NLP Engineer
  // ══════════════════════════════════════════════════════════
  {
    roleType: "AI/ML Engineer",
    score: 96,
    skills: ["LangChain", "RAG", "Python", "HuggingFace", "FAISS", "OpenAI API", "Vector Databases", "Fine-tuning"],
    content: `[NAME]
[LOCATION] | [EMAIL] | [PHONE] | [LINKEDIN] | [GITHUB]

SUMMARY
LLM/NLP Engineer specializing in large language models, RAG systems, and production AI applications. Built GenAI products used by 100,000+ users. Deep expertise in prompt engineering, fine-tuning, and LLM evaluation frameworks.

EDUCATION
[UNIVERSITY] | M.Tech — Computer Science (AI Specialization) | CGPA: 9.1/10 | 2021 – 2023
[UNIVERSITY] | B.Tech — Computer Science | CGPA: 8.9/10 | 2017 – 2021

SKILLS
LLM / NLP: LangChain, LlamaIndex, HuggingFace Transformers, OpenAI API, Gemini API, Anthropic API
RAG & Search: FAISS, Pinecone, Weaviate, Chroma, hybrid search, re-ranking, BM25
Fine-tuning: LoRA, QLoRA, PEFT, instruction tuning, RLHF, DPO
Evaluation: RAGAS, LangSmith, DeepEval, TruLens, custom LLM judges
Languages: Python, TypeScript, SQL
Infra: FastAPI, Docker, AWS Lambda, Redis, Celery

EXPERIENCE
LLM Engineer — [COMPANY] | Aug 2023 – Present
- Built a production RAG system over 200,000 enterprise documents with semantic chunking, hybrid BM25+vector retrieval, and cross-encoder re-ranking achieving 94% answer accuracy vs 71% baseline
- Fine-tuned Mistral-7B on 50,000 domain-specific instruction pairs using QLoRA achieving 23% improvement over GPT-3.5 on internal evaluation suite at 10x lower inference cost
- Designed an LLM evaluation framework running 500+ automated test cases nightly, catching 12 quality regressions before production
- Reduced LLM API costs by 55% through prompt compression, response caching, and intelligent routing between models
- Led a team of 3 engineers to deliver an AI customer support agent handling 40% of support tickets autonomously

NLP Engineer — [COMPANY] | Jul 2021 – Jul 2023
- Developed a multi-label document classification pipeline (BERT) achieving 91% F1 across 25 categories processing 10,000 documents/day
- Built a named entity recognition system for legal documents using spaCy and custom NER with 94% precision
- Designed a semantic search engine over 1M+ product descriptions using sentence-transformers and FAISS with sub-50ms query latency

PROJECTS
Multi-Agent Research Assistant | LangChain | GPT-4 | Tavily | FastAPI
- Built a multi-agent system with planning, web search, and synthesis agents producing research reports 5x faster than manual process

Knowledge Graph QA | Neo4j | LangChain | SPARQL
- Constructed a domain knowledge graph with 500K nodes enabling hybrid graph + vector reasoning for complex multi-hop queries

CERTIFICATIONS
- DeepLearning.AI — LLMOps Specialization
- OpenAI — Building Systems with the ChatGPT API`
  },

  // ══════════════════════════════════════════════════════════
  //  AI/Data 4 — Data Analyst (SQL / Python / Tableau)
  // ══════════════════════════════════════════════════════════
  {
    roleType: "Data Scientist",
    score: 91,
    skills: ["SQL", "Python", "Tableau", "Power BI", "Excel", "BigQuery", "dbt", "Data Modeling"],
    content: `[NAME]
[LOCATION] | [EMAIL] | [PHONE] | [LINKEDIN] | [GITHUB]

SUMMARY
Data Analyst with 3 years of experience translating complex data into actionable business insights. Delivered 80+ analytical reports influencing product roadmap, marketing spend, and operations. Expert in SQL, Python, Tableau, and self-serve analytics platforms.

EDUCATION
[UNIVERSITY] | B.Tech — Information Technology | CGPA: 8.6/10 | 2019 – 2023

SKILLS
Analytics: SQL (advanced), Python (Pandas, NumPy, SciPy), R
Visualization: Tableau, Power BI, Looker, Metabase, Matplotlib, Seaborn
Data Engineering: dbt, Apache Airflow, BigQuery, Redshift, Snowflake, ETL pipelines
Excel: Advanced formulas, VBA macros, pivot tables, Power Query
Statistics: Hypothesis testing, regression analysis, cohort analysis, funnel analysis
Tools: Google Analytics, Mixpanel, Amplitude, Segment, Jira

EXPERIENCE
Senior Data Analyst — [COMPANY] | Jun 2023 – Present
- Designed and maintained 25 Tableau dashboards used by 200+ stakeholders providing real-time visibility into $50M revenue pipeline
- Performed cohort analysis revealing 3 key drop-off points in user onboarding, informing product changes that improved 30-day retention by 18%
- Built dbt data models standardizing metrics definitions across 8 business units, eliminating conflicting reports that had cost 2 weeks of management time
- Developed Python scripts automating 6 recurring reports saving 15 hours per week of analyst time
- Partnered with marketing to optimize $2M ad budget through channel attribution analysis, improving CAC by 24%

Data Analyst — [COMPANY] | Aug 2021 – May 2023
- Wrote complex SQL queries on BigQuery across 20+ tables to answer ad-hoc business questions for C-level stakeholders
- Built an automated KPI reporting system using Python and Google Sheets API replacing 4 manual Excel processes
- Conducted A/B test analysis for 12 product experiments using statistical significance testing guiding go/no-go decisions

PROJECTS
Sales Performance Dashboard | Tableau | SQL | dbt
- Created an interactive Tableau dashboard tracking 40 KPIs across 5 sales regions with drill-down capabilities, reducing weekly reporting time by 8 hours

Customer Lifetime Value Model | Python | scikit-learn | BigQuery
- Developed a BG/NBD CLV model segmenting 500,000 customers, enabling targeted campaigns with 3.2x higher conversion rate

CERTIFICATIONS
- Google Data Analytics Professional Certificate
- Tableau Desktop Specialist
- dbt Analytics Engineering Certification`
  },

  // ══════════════════════════════════════════════════════════
  //  AI/Data 5 — Computer Vision Engineer
  // ══════════════════════════════════════════════════════════
  {
    roleType: "AI/ML Engineer",
    score: 94,
    skills: ["Python", "PyTorch", "OpenCV", "YOLO", "TensorRT", "CUDA", "Computer Vision", "Deep Learning"],
    content: `[NAME]
[LOCATION] | [EMAIL] | [PHONE] | [LINKEDIN] | [GITHUB]

SUMMARY
Computer Vision Engineer with 2.5 years of experience developing real-time vision systems for industrial and consumer applications. Deployed models running at 60+ FPS on edge devices. Deep expertise in object detection, segmentation, and video analytics.

EDUCATION
[UNIVERSITY] | M.Tech — Computer Science (Vision & ML) | CGPA: 9.0/10 | 2020 – 2022
[UNIVERSITY] | B.Tech — Electronics and CS | CGPA: 8.7/10 | 2016 – 2020

SKILLS
CV & DL: PyTorch, TensorFlow, OpenCV, YOLO (v5/v8), Detectron2, MMDetection, SAM, CLIP
Optimization: TensorRT, ONNX, OpenVINO, model pruning, quantization, knowledge distillation
Languages: Python, C++, CUDA, SQL
MLOps: MLflow, DVC, Docker, AWS SageMaker, NVIDIA Triton Inference Server
Data: Pandas, NumPy, Albumentations, Roboflow, CVAT, LabelStudio
Hardware: NVIDIA Jetson, Raspberry Pi, edge deployment

EXPERIENCE
Computer Vision Engineer — [COMPANY] | Aug 2022 – Present
- Developed a real-time object detection system using YOLOv8 and TensorRT achieving 72 FPS on NVIDIA Jetson Xavier NX — 4x faster than baseline
- Built an automated visual quality inspection system replacing manual inspection for 10,000 units/day, reducing defect escape rate from 2.3% to 0.1%
- Trained a custom instance segmentation model on 50,000 annotated images achieving 88% mAP@0.5:0.95, deployed on AWS SageMaker
- Designed a video analytics pipeline processing 200 concurrent camera streams using NVIDIA Triton Inference Server with 99.2% uptime
- Reduced cloud GPU inference costs by 45% through INT8 quantization and dynamic batching

ML Engineer — [COMPANY] | Jul 2020 – Jul 2022
- Developed a face recognition system achieving 99.3% accuracy at 1:1M scale using ArcFace and FAISS index
- Built document layout analysis pipeline combining YOLOv5 and OCR processing 5,000 pages/hour
- Created a synthetic data generation pipeline with GANs augmenting training sets by 10x for rare defect classes

PROJECTS
Pose Estimation System | PyTorch | MediaPipe | OpenCV
- Built real-time multi-person pose estimation at 45 FPS on CPU using lightweight HRNet, deployed in fitness app with 50,000 users

Autonomous Drone Navigation | PyTorch | ROS | CUDA
- Developed visual odometry and obstacle avoidance system for indoor drone navigation using depth estimation and semantic segmentation

CERTIFICATIONS
- NVIDIA Deep Learning Institute — Computer Vision
- Coursera — Convolutional Neural Networks (deeplearning.ai)`
  },
];

// ─── Embedding + Insert ───────────────────────────────────────────────────────

async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
  const result = await model.embedContent(text.slice(0, 2000));
  return result.embedding.values;
}

async function seed() {
  console.log("🔗 Connecting to MongoDB…");
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected\n");

  // Clear existing seeds
  await TopResume.deleteMany({});
  console.log("🗑️  Cleared existing TopResume documents\n");

  for (let i = 0; i < resumes.length; i++) {
    const r = resumes[i];
    console.log(`[${i + 1}/10] Embedding: ${r.roleType} (score ${r.score})…`);

    const embedding = await generateEmbedding(r.content);
    await TopResume.create({
      anonymizedContent: r.content,
      embedding,
      score: r.score,
      roleType: r.roleType,
      skills: r.skills,
    });

    console.log(`       ✅ Stored — ${embedding.length}-dim embedding\n`);

    // Small delay to avoid Gemini rate limits
    if (i < resumes.length - 1) await new Promise(r => setTimeout(r, 1000));
  }

  console.log("🎉 Seed complete — 10 resumes stored in TopResume collection");
  await mongoose.disconnect();
}

seed().catch(err => { console.error("❌ Seed failed:", err); process.exit(1); });
