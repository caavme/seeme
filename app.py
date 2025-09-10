from flask import Flask, render_template, request, jsonify, send_file, session
import json
import os
from datetime import datetime
import uuid
import re
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.lib.units import inch
import io
import glob
import traceback

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'

class ResumeWebApp:
    def __init__(self):
        self.resume_data = {}
        self.current_filename = None
        self.resumes_directory = "resumes"
        self.ensure_resumes_directory()
        self.initialize_empty_resume()
    
    def ensure_resumes_directory(self):
        """Ensure the resumes directory exists"""
        if not os.path.exists(self.resumes_directory):
            os.makedirs(self.resumes_directory)
    
    def initialize_empty_resume(self):
        """Initialize with completely empty resume data"""
        self.resume_data = {
            "basics": {
                "name": "",
                "label": "",
                "email": "",
                "phone": "",
                "summary": "",
                "objective": "",
                "location": {"city": ""},
                "profiles": []
            },
            "work": [],
            "skills": {"technologies": []},
            "education": []
        }
        self.current_filename = None
    
    def sort_work_by_date(self):
        """Sort work experience by start date (most recent first)"""
        if "work" not in self.resume_data or not self.resume_data["work"]:
            return
        
        def get_sort_date(work_item):
            """Extract date for sorting - prioritize current jobs, then by start date"""
            # Current jobs (isWorkingHere = True) should appear first
            if work_item.get("isWorkingHere", False):
                return "9999-12-31"  # Future date to sort current jobs first
            
            # For ended jobs, use start date
            start_date = work_item.get("startDate", "")
            if start_date:
                try:
                    # Extract just the date part (YYYY-MM-DD)
                    return start_date.split("T")[0]
                except:
                    return "1900-01-01"  # Default old date for invalid dates
            
            return "1900-01-01"  # Default for jobs with no start date
        
        # Sort work experience: current jobs first, then by start date (newest first)
        self.resume_data["work"].sort(key=get_sort_date, reverse=True)
    
    def sort_education_by_date(self):
        """Sort education by start date (most recent first)"""
        if "education" not in self.resume_data or not self.resume_data["education"]:
            return
        
        def get_education_sort_date(edu_item):
            """Extract date for sorting education"""
            # Current studies should appear first
            if edu_item.get("isStudyingHere", False):
                return "9999-12-31"  # Future date to sort current studies first
            
            # For completed education, use start date
            start_date = edu_item.get("startDate", "")
            if start_date:
                try:
                    return start_date.split("T")[0]
                except:
                    return "1900-01-01"
            
            return "1900-01-01"
        
        # Sort education: current studies first, then by start date (newest first)
        self.resume_data["education"].sort(key=get_education_sort_date, reverse=True)
    
    def get_available_resumes(self):
        """Get list of available resume files"""
        resume_files = []
        
        # Get files from resumes directory only
        pattern = os.path.join(self.resumes_directory, "*.json")
        for filepath in glob.glob(pattern):
            filename = os.path.basename(filepath)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    name = data.get('basics', {}).get('name', 'Untitled Resume')
                    modified = datetime.fromtimestamp(os.path.getmtime(filepath))
                    resume_files.append({
                        'filename': filename,
                        'name': name,
                        'modified': modified.strftime('%Y-%m-%d %H:%M:%S'),
                        'path': filepath
                    })
            except:
                continue
        
        # Sort by modified date (newest first)
        resume_files.sort(key=lambda x: x['modified'], reverse=True)
        return resume_files
    
    def create_new_resume(self, name="New Resume"):
        """Create a new blank resume"""
        self.initialize_empty_resume()
        return self.resume_data
    
    def load_resume(self, filename):
        """Load a specific resume file"""
        try:
            # Only load from resumes directory
            filepath = os.path.join(self.resumes_directory, filename)
            
            with open(filepath, "r", encoding="utf-8") as file:
                self.resume_data = json.load(file)
                self.current_filename = filename
                
                # Sort work and education by date after loading
                self.sort_work_by_date()
                self.sort_education_by_date()
                
                return True
        except Exception as e:
            print(f"Error loading resume {filename}: {e}")
            return False
    
    def save_resume(self, filename=None, save_as=False):
        """Save resume data to JSON file"""
        # Sort work and education by date before saving
        self.sort_work_by_date()
        self.sort_education_by_date()
        
        if filename is None and self.current_filename is None:
            # Generate filename based on name and timestamp
            name = self.resume_data.get('basics', {}).get('name', 'Resume')
            # Clean filename
            clean_name = re.sub(r'[^\w\s-]', '', name).strip()
            clean_name = re.sub(r'[-\s]+', '_', clean_name)
            if not clean_name:
                clean_name = "Resume"
            timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
            filename = f"{clean_name}_{timestamp}.json"
        elif filename is None:
            filename = self.current_filename
        
        # Always save to resumes directory
        filepath = os.path.join(self.resumes_directory, filename)
        
        try:
            with open(filepath, "w", encoding="utf-8") as file:
                json.dump(self.resume_data, file, indent=4, ensure_ascii=False)
            
            if save_as or self.current_filename is None:
                self.current_filename = filename
            
            return filename
        except Exception as e:
            print(f"Error saving resume: {e}")
            return None
    
    def delete_resume(self, filename):
        """Delete a resume file"""
        try:
            filepath = os.path.join(self.resumes_directory, filename)
            if os.path.exists(filepath):
                os.remove(filepath)
                return True, "Resume deleted successfully"
            else:
                return False, "Resume file not found"
        except Exception as e:
            return False, f"Error deleting resume: {str(e)}"
    
    def update_basics(self, data):
        """Update basic information"""
        if "basics" not in self.resume_data:
            self.resume_data["basics"] = {}
        
        basics = self.resume_data["basics"]
        basics.update({
            "name": data.get("name", ""),
            "label": data.get("label", ""),
            "email": data.get("email", ""),
            "phone": data.get("phone", ""),
            "summary": f"<p>{data.get('summary', '').strip()}</p>" if data.get('summary', '').strip() else "",
            "objective": f"<p>{data.get('objective', '').strip()}</p>" if data.get('objective', '').strip() else ""
        })
        
        if "location" not in basics:
            basics["location"] = {}
        basics["location"]["city"] = data.get("city", "")
    
    def add_work_experience(self, work_data):
        """Add or update work experience"""
        if "work" not in self.resume_data:
            self.resume_data["work"] = []
        
        work_item = {
            "id": work_data.get("id", str(uuid.uuid4().hex[:16])),
            "name": work_data.get("company", ""),
            "position": work_data.get("position", ""),
            "startDate": f"{work_data.get('startDate', '')}T04:00:00.000Z" if work_data.get('startDate') else "",
            "endDate": f"{work_data.get('endDate', '')}T04:00:00.000Z" if work_data.get('endDate') and not work_data.get('currentlyWorking') else None,
            "isWorkingHere": work_data.get("currentlyWorking", False),
            "summary": f"<p>{work_data.get('summary', '').strip()}</p>" if work_data.get('summary', '').strip() else "",
            "highlights": [],
            "url": "",
            "years": ""
        }
        
        # Check if updating existing item
        work_id = work_data.get("id")
        if work_id:
            for i, existing_work in enumerate(self.resume_data["work"]):
                if existing_work.get("id") == work_id:
                    self.resume_data["work"][i] = work_item
                    # Sort after updating
                    self.sort_work_by_date()
                    return
        
        # Add new item
        self.resume_data["work"].append(work_item)
        # Sort after adding
        self.sort_work_by_date()
    
    def delete_work_experience(self, work_id):
        """Delete work experience by ID"""
        if "work" in self.resume_data:
            self.resume_data["work"] = [
                work for work in self.resume_data["work"] 
                if work.get("id") != work_id
            ]
            # Re-sort after deletion (though order shouldn't change)
            self.sort_work_by_date()
    
    def add_education(self, education_data):
        """Add or update education entry"""
        if "education" not in self.resume_data:
            self.resume_data["education"] = []
        
        education_item = {
            "id": education_data.get("id", str(uuid.uuid4().hex[:16])),
            "institution": education_data.get("institution", ""),
            "area": education_data.get("area", ""),
            "studyType": education_data.get("studyType", ""),
            "startDate": f"{education_data.get('startDate', '')}T04:00:00.000Z" if education_data.get('startDate') else "",
            "endDate": f"{education_data.get('endDate', '')}T04:00:00.000Z" if education_data.get('endDate') and not education_data.get('currentlyStudying') else None,
            "isStudyingHere": education_data.get("currentlyStudying", False),
            "gpa": education_data.get("gpa", ""),
            "courses": [course.strip() for course in education_data.get("courses", "").split(',') if course.strip()] if education_data.get("courses") else [],
            "summary": f"<p>{education_data.get('summary', '').strip()}</p>" if education_data.get('summary', '').strip() else "",
            "url": ""
        }
        
        # Check if updating existing item
        education_id = education_data.get("id")
        if education_id:
            for i, existing_education in enumerate(self.resume_data["education"]):
                if existing_education.get("id") == education_id:
                    self.resume_data["education"][i] = education_item
                    # Sort after updating
                    self.sort_education_by_date()
                    return
        
        # Add new item
        self.resume_data["education"].append(education_item)
        # Sort after adding
        self.sort_education_by_date()
    
    def delete_education(self, education_id):
        """Delete education entry by ID"""
        if "education" in self.resume_data:
            self.resume_data["education"] = [
                education for education in self.resume_data["education"] 
                if education.get("id") != education_id
            ]
            # Re-sort after deletion
            self.sort_education_by_date()
    
    def add_skill(self, skill_name):
        """Add a skill"""
        if "skills" not in self.resume_data:
            self.resume_data["skills"] = {"technologies": []}
        if "technologies" not in self.resume_data["skills"]:
            self.resume_data["skills"]["technologies"] = []
        
        # Check if skill already exists
        existing_skills = [tech.get("name", "").lower() for tech in self.resume_data["skills"]["technologies"]]
        if skill_name.lower() not in existing_skills:
            self.resume_data["skills"]["technologies"].append({
                "name": skill_name,
                "level": 0
            })
    
    def delete_skill(self, skill_index):
        """Delete skill by index"""
        if "skills" in self.resume_data and "technologies" in self.resume_data["skills"]:
            technologies = self.resume_data["skills"]["technologies"]
            if 0 <= skill_index < len(technologies):
                del technologies[skill_index]
    
    def clean_html(self, text):
        """Remove simple HTML tags for display"""
        if not text:
            return ""
        text = re.sub(r'<p>|</p>|<br>|&nbsp;', '', text)
        text = re.sub(r'•\s*', '• ', text)
        return text.strip()
    
    def format_date(self, date_string):
        """Format ISO date string to readable format"""
        if not date_string:
            return ""
        try:
            date_obj = datetime.fromisoformat(date_string.replace('Z', '+00:00'))
            return date_obj.strftime("%B %Y")
        except:
            return date_string[:10] if len(date_string) >= 10 else date_string
    
    def create_pdf(self):
        """Create modern, ATS-compliant PDF and return as bytes"""
        try:
            # Sort work and education by date before PDF generation
            self.sort_work_by_date()
            self.sort_education_by_date()
            
            buffer = io.BytesIO()
            
            # Create document with refined margins
            doc = SimpleDocTemplate(buffer, pagesize=letter,
                                  rightMargin=54, leftMargin=54,
                                  topMargin=54, bottomMargin=54)
            
            # Get default styles and create custom ones
            styles = getSampleStyleSheet()
            
            # Define modern, ATS-compliant color palette
            primary_color = colors.HexColor('#2c3e50')    # Dark blue-gray
            accent_color = colors.HexColor('#3498db')     # Professional blue  
            text_color = colors.HexColor('#2c3e50')       # Dark text
            light_gray = colors.HexColor('#7f8c8d')       # Light gray for dates
            
            # Create modern paragraph styles using ATS-friendly fonts
            base_font = 'Helvetica'  # ATS-compliant standard font
            
            # Header styles
            name_style = ParagraphStyle(
                'ModernName',
                parent=styles['Heading1'],
                fontName='Helvetica-Bold',
                fontSize=26,
                spaceAfter=8,
                alignment=TA_CENTER,
                textColor=primary_color,
                leading=30
            )
            
            title_style = ParagraphStyle(
                'ModernTitle', 
                parent=styles['Normal'],
                fontName='Helvetica',
                fontSize=14,
                spaceAfter=6,
                alignment=TA_CENTER,
                textColor=accent_color,
                leading=16
            )
            
            contact_style = ParagraphStyle(
                'ModernContact',
                parent=styles['Normal'],
                fontName='Helvetica',
                fontSize=10,
                spaceAfter=18,
                alignment=TA_CENTER,
                textColor=text_color,
                leading=12
            )
            
            # Section header style
            section_style = ParagraphStyle(
                'ModernSection',
                parent=styles['Heading2'],
                fontName='Helvetica-Bold',
                fontSize=14,
                spaceBefore=20,
                spaceAfter=10,
                textColor=primary_color,
                leading=16
            )
            
            # Job title style
            job_title_style = ParagraphStyle(
                'ModernJobTitle',
                parent=styles['Normal'],
                fontName='Helvetica-Bold',
                fontSize=12,
                spaceBefore=12,
                spaceAfter=2,
                textColor=primary_color,
                leading=14
            )
            
            # Company and date style
            company_style = ParagraphStyle(
                'ModernCompany',
                parent=styles['Normal'],
                fontName='Helvetica',
                fontSize=11,
                spaceAfter=2,
                textColor=accent_color,
                leading=13
            )
            
            date_style = ParagraphStyle(
                'ModernDate',
                parent=styles['Normal'],
                fontName='Helvetica-Oblique',
                fontSize=9,
                spaceAfter=8,
                textColor=light_gray,
                leading=11
            )
            
            # Content text style
            content_style = ParagraphStyle(
                'ModernContent',
                parent=styles['Normal'],
                fontName='Helvetica',
                fontSize=10,
                spaceAfter=12,
                textColor=text_color,
                leading=13,
                alignment=TA_JUSTIFY
            )
            
            # Skills style
            skills_style = ParagraphStyle(
                'ModernSkills',
                parent=styles['Normal'],
                fontName='Helvetica',
                fontSize=10,
                spaceAfter=12,
                textColor=text_color,
                leading=14
            )
            
            story = []
            basics = self.resume_data.get("basics", {})
            
            # Header Section
            if basics.get("name"):
                story.append(Paragraph(basics["name"].upper(), name_style))
            else:
                story.append(Paragraph("YOUR NAME HERE", name_style))
            
            # Professional Title
            if basics.get("label"):
                story.append(Paragraph(basics["label"], title_style))
            
            # Contact Information (simplified without icons)
            contact_info = []
            if basics.get("email"):
                contact_info.append(basics["email"])
            if basics.get("phone"):
                contact_info.append(basics["phone"])
            if basics.get("location", {}).get("city"):
                contact_info.append(basics["location"]["city"])
            
            if contact_info:
                story.append(Paragraph("  •  ".join(contact_info), contact_style))
            
            # Add separator space
            story.append(Spacer(1, 20))
            
            # Professional Summary
            if basics.get("summary") and basics["summary"].strip():
                story.append(Paragraph("PROFESSIONAL SUMMARY", section_style))
                clean_summary = self.clean_html(basics["summary"])
                story.append(Paragraph(clean_summary, content_style))
                story.append(Spacer(1, 10))
            
            # Career Objective
            if basics.get("objective") and basics["objective"].strip():
                story.append(Paragraph("CAREER OBJECTIVE", section_style))
                clean_objective = self.clean_html(basics["objective"])
                story.append(Paragraph(clean_objective, content_style))
                story.append(Spacer(1, 10))
            
            # Work Experience (already sorted)
            work_items = self.resume_data.get("work", [])
            if work_items:
                story.append(Paragraph("PROFESSIONAL EXPERIENCE", section_style))
                
                for work in work_items:
                    company = work.get("name", "")
                    position = work.get("position", "")
                    
                    if position:
                        story.append(Paragraph(position, job_title_style))
                    
                    if company:
                        story.append(Paragraph(company, company_style))
                    
                    # Date range
                    start_date = self.format_date(work.get("startDate", ""))
                    end_date = self.format_date(work.get("endDate", "")) if work.get("endDate") else "Present"
                    
                    if start_date:
                        date_text = f"{start_date} - {end_date}"
                        story.append(Paragraph(date_text, date_style))
                    
                    # Job description
                    if work.get("summary") and work["summary"].strip():
                        clean_summary = self.clean_html(work["summary"])
                        # Format bullet points properly
                        if '•' in clean_summary:
                            bullets = [bullet.strip() for bullet in clean_summary.split('•') if bullet.strip()]
                            for bullet in bullets:
                                if bullet:
                                    story.append(Paragraph(f"• {bullet}", content_style))
                        else:
                            story.append(Paragraph(clean_summary, content_style))
                    
                    story.append(Spacer(1, 8))
            
            # Education (already sorted)
            education_items = self.resume_data.get("education", [])
            if education_items:
                story.append(Paragraph("EDUCATION", section_style))
                
                for education in education_items:
                    institution = education.get("institution", "")
                    area = education.get("area", "")
                    study_type = education.get("studyType", "")
                    
                    if institution:
                        story.append(Paragraph(institution, job_title_style))
                    
                    # Degree information
                    degree_info = []
                    if study_type:
                        degree_info.append(study_type)
                    if area:
                        degree_info.append(f"in {area}")
                    
                    if degree_info:
                        story.append(Paragraph(" ".join(degree_info), company_style))
                    
                    # Date range
                    start_date = self.format_date(education.get("startDate", ""))
                    end_date = self.format_date(education.get("endDate", "")) if education.get("endDate") else "Present"
                    
                    if start_date:
                        date_text = f"{start_date} - {end_date}"
                        story.append(Paragraph(date_text, date_style))
                    
                    # GPA
                    if education.get("gpa"):
                        story.append(Paragraph(f"GPA: {education['gpa']}", content_style))
                    
                    # Additional details
                    if education.get("summary") and education["summary"].strip():
                        clean_summary = self.clean_html(education["summary"])
                        story.append(Paragraph(clean_summary, content_style))
                    
                    # Relevant courses
                    if education.get("courses") and len(education["courses"]) > 0:
                        valid_courses = [course.strip() for course in education["courses"] if course.strip()]
                        if valid_courses:
                            courses_text = f"Relevant Coursework: {', '.join(valid_courses)}"
                            story.append(Paragraph(courses_text, content_style))
                    
                    story.append(Spacer(1, 8))
            
            # Technical Skills
            skills = self.resume_data.get("skills", {})
            technologies = skills.get("technologies", [])
            if technologies:
                story.append(Paragraph("TECHNICAL SKILLS", section_style))
                
                skill_names = [tech.get("name", "") for tech in technologies if tech.get("name")]
                if skill_names:
                    # Group skills in a clean format
                    skills_text = " • ".join(skill_names)
                    story.append(Paragraph(skills_text, skills_style))
            
            # Footer space
            story.append(Spacer(1, 20))
            
            # If no content exists, add a placeholder
            if len(story) <= 5:  # Only header and separator elements
                story.append(Paragraph("This resume is empty. Please add your information using the web interface.", content_style))
            
            doc.build(story)
            buffer.seek(0)
            return buffer
            
        except Exception as e:
            print(f"PDF Creation Error: {str(e)}")
            print(f"Full traceback: {traceback.format_exc()}")
            raise e

# Initialize the resume app
resume_app = ResumeWebApp()

@app.route('/')
def index():
    # Sort work and education by date before rendering
    resume_app.sort_work_by_date()
    resume_app.sort_education_by_date()
    return render_template('index.html', 
                         resume_data=resume_app.resume_data, 
                         current_filename=resume_app.current_filename)

@app.route('/api/resumes')
def get_resumes():
    """Get list of available resumes"""
    resumes = resume_app.get_available_resumes()
    return jsonify({
        "success": True, 
        "resumes": resumes,
        "current_filename": resume_app.current_filename
    })

@app.route('/api/resume/new', methods=['POST'])
def create_new_resume():
    """Create a new resume"""
    resume_app.create_new_resume()
    return jsonify({
        "success": True, 
        "message": "New resume created",
        "resume_data": resume_app.resume_data
    })

@app.route('/api/resume/load', methods=['POST'])
def load_resume():
    """Load a specific resume"""
    data = request.get_json()
    filename = data.get('filename')
    
    if not filename:
        return jsonify({"success": False, "message": "Filename is required"})
    
    if resume_app.load_resume(filename):
        return jsonify({
            "success": True, 
            "message": f"Resume '{filename}' loaded successfully",
            "resume_data": resume_app.resume_data,
            "current_filename": resume_app.current_filename
        })
    else:
        return jsonify({"success": False, "message": f"Failed to load resume '{filename}'"})

@app.route('/api/resume/save', methods=['POST'])
def save_resume():
    """Save current resume"""
    data = request.get_json()
    filename = data.get('filename')
    save_as = data.get('save_as', False)
    
    saved_filename = resume_app.save_resume(filename, save_as)
    
    if saved_filename:
        return jsonify({
            "success": True, 
            "message": f"Resume saved as '{saved_filename}'",
            "filename": saved_filename
        })
    else:
        return jsonify({"success": False, "message": "Failed to save resume"})

@app.route('/api/resume/delete', methods=['DELETE'])
def delete_resume():
    """Delete a resume"""
    data = request.get_json()
    filename = data.get('filename')
    
    if not filename:
        return jsonify({"success": False, "message": "Filename is required"})
    
    success, message = resume_app.delete_resume(filename)
    return jsonify({"success": success, "message": message})

@app.route('/api/basics', methods=['POST'])
def update_basics():
    data = request.get_json()
    resume_app.update_basics(data)
    resume_app.save_resume()
    return jsonify({"success": True, "message": "Basic information updated successfully"})

@app.route('/api/work', methods=['POST'])
def add_work():
    data = request.get_json()
    resume_app.add_work_experience(data)
    resume_app.save_resume()
    return jsonify({"success": True, "message": "Work experience added successfully"})

@app.route('/api/work/<work_id>', methods=['DELETE'])
def delete_work(work_id):
    resume_app.delete_work_experience(work_id)
    resume_app.save_resume()
    return jsonify({"success": True, "message": "Work experience deleted successfully"})

@app.route('/api/education', methods=['POST'])
def add_education():
    data = request.get_json()
    resume_app.add_education(data)
    resume_app.save_resume()
    return jsonify({"success": True, "message": "Education entry added successfully"})

@app.route('/api/education/<education_id>', methods=['DELETE'])
def delete_education(education_id):
    resume_app.delete_education(education_id)
    resume_app.save_resume()
    return jsonify({"success": True, "message": "Education entry deleted successfully"})

@app.route('/api/skills', methods=['POST'])
def add_skill():
    data = request.get_json()
    skill_name = data.get('name')
    if skill_name:
        resume_app.add_skill(skill_name)
        resume_app.save_resume()
        return jsonify({"success": True, "message": "Skill added successfully"})
    return jsonify({"success": False, "message": "Skill name is required"})

@app.route('/api/skills/<int:skill_index>', methods=['DELETE'])
def delete_skill(skill_index):
    resume_app.delete_skill(skill_index)
    resume_app.save_resume()
    return jsonify({"success": True, "message": "Skill deleted successfully"})

@app.route('/api/data')
def get_data():
    # Sort work and education by date before sending to frontend
    resume_app.sort_work_by_date()
    resume_app.sort_education_by_date()
    return jsonify(resume_app.resume_data)

@app.route('/api/export/pdf')
def export_pdf():
    try:
        pdf_buffer = resume_app.create_pdf()
        # Use current filename for PDF name or generate one from name
        pdf_name = 'resume.pdf'
        if resume_app.current_filename:
            base_name = os.path.splitext(resume_app.current_filename)[0]
            pdf_name = f"{base_name}.pdf"
        elif resume_app.resume_data.get('basics', {}).get('name'):
            name = resume_app.resume_data['basics']['name']
            clean_name = re.sub(r'[^\w\s-]', '', name).strip().replace(' ', '_')
            pdf_name = f"{clean_name}_resume.pdf"
        
        return send_file(
            pdf_buffer,
            as_attachment=True,
            download_name=pdf_name,
            mimetype='application/pdf'
        )
    except Exception as e:
        print(f"Export PDF Error: {str(e)}")
        print(f"Full traceback: {traceback.format_exc()}")
        return jsonify({"success": False, "error": f"PDF export failed: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)