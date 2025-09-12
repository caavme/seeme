# 🚀 SeeMe Resume Builder

A modern, professional resume builder web application built with Flask that allows users to create, manage, and export resumes in multiple formats. Features a sleek, responsive interface with real-time editing capabilities.

![Resume Builder Demo](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Python](https://img.shields.io/badge/Python-3.7+-blue)
![Flask](https://img.shields.io/badge/Flask-2.3.3-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### 🎨 **Modern Web Interface**
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Bootstrap 5.3**: Modern, clean UI with gradient themes and smooth animations
- **Real-time Editing**: Live updates as you type with auto-save functionality
- **Tabbed Navigation**: Organized sections for Personal Info, Experience, Skills, and Education

### 📄 **Resume Management**
- **Multiple Resume Support**: Create and manage multiple resume files
- **JSON Storage**: Resume data stored in structured JSON format
- **Auto-save**: Automatic saving every 30 seconds when a file is loaded
- **File Management**: New, Open, Save, and Save As functionality

### 💼 **Professional Sections**
- **Personal Information**: Name, title, contact details, professional summary, and career objectives
- **Work Experience**: Job positions with company details, dates, and achievements (sorted by date)
- **Education**: Academic background with institutions, degrees, GPA, and relevant coursework
- **Technical Skills**: Tag-based skill management with easy add/remove functionality

### 📤 **Export Options**
- **PDF Export**: ATS-compliant PDF resumes with professional formatting and compact spacing
- **HTML Export**: Clean, styled HTML files perfect for online portfolios and websites
- **Professional Formatting**: Modern typography, proper spacing, and print-friendly layouts

### 🎯 **Smart Features**
- **Date-based Sorting**: Work experience and education automatically sorted by date (most recent first)
- **Current Position Indicators**: Visual badges for current jobs and ongoing education
- **Form Validation**: Built-in validation to ensure data integrity
- **Responsive Modals**: Clean modal dialogs for adding/editing entries

## 🚀 Quick Start

### Prerequisites
- Python 3.7 or higher
- pip (Python package installer)

### Installation

1. **Clone the repository**
git clone https://github.com/caavme/seeme-resume-builder.git cd seeme-resume-builder

2. **Install dependencies**
pip install -r requirements.txt

3. **Run the application**
python app.py

4. **Open your browser**
   Navigate to `http://localhost:5000` to start building your resume!

## 📦 Dependencies
Flask==2.3.3 reportlab==4.0.4 Werkzeug==2.3.7 Jinja2==3.1.2

## 🏗️ Project Structure
seeme-resume-builder/ ├── app.py                 # Main Flask application ├── resume_builder.py      # Legacy Tkinter version (optional) ├── requirements.txt       # Python dependencies ├── README.md             # Project documentation ├── resumes/              # Directory for saved resume JSON files ├── templates/            # Jinja2 HTML templates │   ├── base.html        # Base template with header and modals │   └── index.html       # Main resume builder interface └── static/              # Static assets ├── css/ │   └── style.css    # Custom CSS styles and animations └── js/ └── app.js       # Frontend JavaScript functionality

## 💻 Usage Guide

### Creating Your First Resume

1. **Personal Information**
   - Fill in your basic details: name, professional title, contact information
   - Write a compelling professional summary and career objective

2. **Work Experience**
   - Click "Add Experience" to add job positions
   - Include company name, position, dates, and job summary
   - Use bullet points in descriptions for better readability
   - Mark current positions with the "Currently working here" checkbox

3. **Skills**
   - Add technical skills one by one
   - Skills appear as interactive badges
   - Easily remove skills by clicking the ✕ button

4. **Education**
   - Add your educational background
   - Include institution, degree type, field of study, GPA, and relevant courses
   - Mark ongoing studies with "Currently studying here"

5. **Export Your Resume**
   - **PDF**: Professional, ATS-compliant format perfect for job applications
   - **HTML**: Clean, web-ready format for online portfolios

### File Management

- **New Resume**: Start fresh with a blank resume
- **Open Resume**: Load previously saved resumes from the file list
- **Save**: Quick save to current file
- **Save As**: Save with a new filename

## 🎨 Customization

### Themes and Colors
The application uses CSS custom properties for easy theming:
:root { --primary-color: #2563eb; --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%); --success-color: #059669; --border-radius: 12px; /* ... more variables */ }

### PDF Styling
Modify the `create_pdf()` method in `app.py` to customize PDF appearance:
- Font sizes and spacing
- Color scheme
- Section layouts
- Margin settings

### HTML Export Styling
Edit the CSS within the `create_html()` method to customize HTML resume appearance.

## 🔧 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Main application interface |
| `/api/data` | GET | Get current resume data |
| `/api/basics` | POST | Update personal information |
| `/api/work` | POST | Add/update work experience |
| `/api/work/<id>` | DELETE | Delete work experience |
| `/api/education` | POST | Add/update education |
| `/api/education/<id>` | DELETE | Delete education entry |
| `/api/skills` | POST | Add skill |
| `/api/skills/<index>` | DELETE | Delete skill |
| `/api/export/pdf` | GET | Export resume as PDF |
| `/api/export/html` | GET | Export resume as HTML |
| `/api/resume/new` | POST | Create new resume |
| `/api/resume/load` | POST | Load existing resume |
| `/api/resume/save` | POST | Save current resume |
| `/api/resume/delete` | DELETE | Delete resume file |

## 🛠️ Development

### Running in Development Mode
export FLASK_ENV=development python app.py

### Code Structure
- **Backend**: Flask application with clean separation of concerns
- **Frontend**: Vanilla JavaScript with Bootstrap 5.3 for UI components
- **Storage**: JSON files for resume data persistence
- **Styling**: Modern CSS with custom properties and animations

## 📱 Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Bootstrap**: For the responsive UI framework
- **ReportLab**: For PDF generation capabilities
- **Flask**: For the lightweight web framework
- **Inter Font**: For beautiful typography

## 📞 Support

If you encounter any issues or have questions:

1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Include screenshots if applicable
4. Mention your Python and browser versions

---

<div align="center">
  <p>Built with ❤️ for job seekers everywhere</p>
  <p>
    <a href="#-quick-start">Get Started</a> •
    <a href="#-usage-guide">Documentation</a> •
    <a href="#-contributing">Contribute</a>
  </p>
</div>