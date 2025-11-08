# The QS Salary Index

**Live, global salary data for Quantity Surveyors**  
[theqssalaryindex.com](http://theqssalaryindex.com)

[![GitHub last commit](https://img.shields.io/github/last-commit/yourusername/qs-salary-index)](https://github.com/yourusername/qs-salary-index/commits/main)
[![GitHub issues](https://img.shields.io/github/issues/yourusername/qs-salary-index)](https://github.com/yourusername/qs-salary-index/issues)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

> Part of **[The QS Collection](https://www.theqscollection.com)** – free tools for QS professionals.

---

## Features

- **Real QS salaries** (UK, US, AU, UAE, + more)
- **Filter** by role, location, experience, sector
- **Sortable table** – click any column
- **Live charts** – avg salary by country, role, distribution
- **Benefits & submission date** shown
- **100% anonymous** submissions
- **No login required**

---

## Screenshots

![QS Salary Index Table](screenshots/table.png)  
*Excel-like table with sorting, benefits, and submission date*

![Charts](screenshots/charts.png)  
*Live salary insights*

---

## Tech Stack

- **HTML5 / CSS3 / Vanilla JS**
- **Chart.js** – interactive charts
- **Formspree** – submission handling
- **GitHub Pages** – hosting
- **No backend, no database**

---

## Project Structure
qs-salary-index/
├── index.html
├── submit.html
├── assets/
│   ├── css/style.css
│   ├── js/
│   │   ├── config.js
│   │   ├── main.js
│   │   └── submit.js
│   ├── data/
│   │   ├── salaries.json
│   │   └── pending.json
│   └── images/
├── screenshots/
└── README.md
