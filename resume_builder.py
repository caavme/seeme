import json
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from datetime import datetime
import uuid
import re

class ResumeBuilder:
    def __init__(self, root):
        self.root = root
        self.root.title("Resume Builder - Modern JSON Editor")
        self.root.geometry("1200x800")
        self.root.configure(bg='#f8f9fa')
        
        # Modern color scheme
        self.colors = {
            'primary': '#2563eb',      # Blue
            'secondary': '#64748b',    # Slate
            'success': '#059669',      # Green
            'warning': '#d97706',      # Orange
            'danger': '#dc2626',       # Red
            'light': '#f8fafc',        # Light gray
            'dark': '#1e293b',         # Dark gray
            'white': '#ffffff',
            'accent': '#8b5cf6'        # Purple
        }
        
        self.resume_data = {}
        self.current_file = None
        
        self.setup_styles()
        self.create_header()
        self.create_menu()
        self.create_main_interface()
        self.create_status_bar()
        
    def setup_styles(self):
        """Configure modern ttk styles"""
        style = ttk.Style()
        style.theme_use('clam')
        
        # Configure notebook style
        style.configure('Modern.TNotebook', 
                       background=self.colors['light'],
                       borderwidth=0)
        style.configure('Modern.TNotebook.Tab',
                       padding=[20, 12],
                       background=self.colors['white'],
                       foreground=self.colors['dark'],
                       focuscolor='none',
                       borderwidth=1,
                       relief='solid')
        style.map('Modern.TNotebook.Tab',
                  background=[('selected', self.colors['primary']),
                             ('active', self.colors['light'])],
                  foreground=[('selected', self.colors['white']),
                             ('active', self.colors['dark'])])
        
        # Configure frame styles
        style.configure('Card.TFrame',
                       background=self.colors['white'],
                       relief='flat',
                       borderwidth=1,
                       lightcolor=self.colors['light'],
                       darkcolor=self.colors['secondary'])
        
    def create_header(self):
        """Create modern header with app title and branding"""
        header_frame = tk.Frame(self.root, bg=self.colors['primary'], height=80)
        header_frame.pack(fill=tk.X)
        header_frame.pack_propagate(False)
        
        # App title
        title_label = tk.Label(header_frame, 
                              text="🚀 Resume Builder Pro",
                              font=('Segoe UI', 24, 'bold'),
                              fg=self.colors['white'],
                              bg=self.colors['primary'])
        title_label.pack(side=tk.LEFT, padx=30, pady=20)
        
        # Quick actions in header
        actions_frame = tk.Frame(header_frame, bg=self.colors['primary'])
        actions_frame.pack(side=tk.RIGHT, padx=30, pady=20)
        
        self.create_modern_button(actions_frame, "📁 Load JSON", self.load_current_file, 
                                 bg=self.colors['white'], fg=self.colors['primary'])
        self.create_modern_button(actions_frame, "📄 Export PDF", self.export_to_pdf,
                                 bg=self.colors['success'], fg=self.colors['white'])
        
    def create_modern_button(self, parent, text, command, bg=None, fg=None, width=120):
        """Create a modern styled button"""
        bg = bg or self.colors['primary']
        fg = fg or self.colors['white']
        
        btn = tk.Button(parent, text=text, command=command,
                       font=('Segoe UI', 10, 'bold'),
                       bg=bg, fg=fg,
                       relief='flat',
                       borderwidth=0,
                       padx=20, pady=10,
                       cursor='hand2',
                       width=12)
        
        # Hover effects
        def on_enter(e):
            btn.configure(bg=self.lighten_color(bg, 0.1))
        def on_leave(e):
            btn.configure(bg=bg)
        
        btn.bind("<Enter>", on_enter)
        btn.bind("<Leave>", on_leave)
        btn.pack(side=tk.LEFT, padx=5)
        return btn
    
    def lighten_color(self, color, factor=0.1):
        """Lighten a hex color by a factor"""
        if color.startswith('#'):
            color = color[1:]
        rgb = tuple(int(color[i:i+2], 16) for i in (0, 2, 4))
        rgb = tuple(min(255, int(c + (255 - c) * factor)) for c in rgb)
        return f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}"
    
    def create_menu(self):
        menubar = tk.Menu(self.root)
        self.root.config(menu=menubar)
        
        file_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="📁 File", menu=file_menu)
        file_menu.add_command(label="🔍 Open JSON", command=self.open_file)
        file_menu.add_command(label="💾 Save", command=self.save_file)
        file_menu.add_command(label="📝 Save As", command=self.save_as_file)
        file_menu.add_separator()
        file_menu.add_command(label="📄 Export to PDF", command=self.export_to_pdf)
        file_menu.add_separator()
        file_menu.add_command(label="❌ Exit", command=self.root.quit)
        
    def create_main_interface(self):
        # Main container
        main_container = tk.Frame(self.root, bg=self.colors['light'])
        main_container.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        
        # Create modern notebook for tabs
        self.notebook = ttk.Notebook(main_container, style='Modern.TNotebook')
        self.notebook.pack(fill=tk.BOTH, expand=True)
        
        # Create tabs with modern styling
        self.create_basics_tab()
        self.create_work_tab()
        self.create_skills_tab()
        self.create_education_tab()
        
    def create_status_bar(self):
        """Create modern status bar"""
        status_frame = tk.Frame(self.root, bg=self.colors['dark'], height=30)
        status_frame.pack(fill=tk.X, side=tk.BOTTOM)
        status_frame.pack_propagate(False)
        
        self.status_label = tk.Label(status_frame,
                                    text="Ready • No file loaded",
                                    font=('Segoe UI', 9),
                                    fg=self.colors['white'],
                                    bg=self.colors['dark'])
        self.status_label.pack(side=tk.LEFT, padx=15, pady=6)
        
    def create_basics_tab(self):
        self.basics_frame = ttk.Frame(self.notebook, style='Card.TFrame')
        self.notebook.add(self.basics_frame, text="👤 Personal Info")
        
        # Create main container with padding
        container = tk.Frame(self.basics_frame, bg=self.colors['white'])
        container.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        
        # Title
        title_label = tk.Label(container,
                              text="Personal Information",
                              font=('Segoe UI', 18, 'bold'),
                              fg=self.colors['dark'],
                              bg=self.colors['white'])
        title_label.pack(anchor='w', pady=(0, 20))
        
        # Create scrollable frame
        canvas = tk.Canvas(container, bg=self.colors['white'], highlightthickness=0)
        scrollbar = ttk.Scrollbar(container, orient="vertical", command=canvas.yview)
        scrollable_frame = tk.Frame(canvas, bg=self.colors['white'])
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        # Modern form fields
        self.create_form_field(scrollable_frame, "Full Name", 0)
        self.name_entry = self.last_entry
        
        self.create_form_field(scrollable_frame, "Professional Title", 1)
        self.label_entry = self.last_entry
        
        self.create_form_field(scrollable_frame, "Email Address", 2)
        self.email_entry = self.last_entry
        
        self.create_form_field(scrollable_frame, "Phone Number", 3)
        self.phone_entry = self.last_entry
        
        self.create_form_field(scrollable_frame, "City", 4)
        self.city_entry = self.last_entry
        
        # Text areas for summary and objective
        self.create_text_field(scrollable_frame, "Professional Summary", 5, 4)
        self.summary_text = self.last_text
        
        self.create_text_field(scrollable_frame, "Career Objective", 6, 4)
        self.objective_text = self.last_text
        
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
    def create_form_field(self, parent, label_text, row):
        """Create a modern form field"""
        # Label
        label = tk.Label(parent,
                        text=label_text,
                        font=('Segoe UI', 11, 'bold'),
                        fg=self.colors['dark'],
                        bg=self.colors['white'])
        label.grid(row=row, column=0, sticky="w", padx=5, pady=15)
        
        # Entry with modern styling
        entry = tk.Entry(parent,
                        font=('Segoe UI', 11),
                        width=50,
                        relief='flat',
                        bd=1,
                        highlightthickness=2,
                        highlightcolor=self.colors['primary'],
                        highlightbackground='#e2e8f0')
        entry.grid(row=row, column=1, padx=15, pady=15, sticky="ew")
        
        # Configure grid weight
        parent.grid_columnconfigure(1, weight=1)
        
        self.last_entry = entry
        return entry
    
    def create_text_field(self, parent, label_text, row, height=4):
        """Create a modern text area field"""
        # Label
        label = tk.Label(parent,
                        text=label_text,
                        font=('Segoe UI', 11, 'bold'),
                        fg=self.colors['dark'],
                        bg=self.colors['white'])
        label.grid(row=row, column=0, sticky="nw", padx=5, pady=15)
        
        # Text widget with modern styling
        text_widget = tk.Text(parent,
                             font=('Segoe UI', 11),
                             width=60,
                             height=height,
                             relief='flat',
                             bd=1,
                             highlightthickness=2,
                             highlightcolor=self.colors['primary'],
                             highlightbackground='#e2e8f0',
                             wrap=tk.WORD)
        text_widget.grid(row=row, column=1, padx=15, pady=15, sticky="ew")
        
        self.last_text = text_widget
        return text_widget
        
    def create_work_tab(self):
        self.work_frame = ttk.Frame(self.notebook, style='Card.TFrame')
        self.notebook.add(self.work_frame, text="💼 Experience")
        
        # Main container
        container = tk.Frame(self.work_frame, bg=self.colors['white'])
        container.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        
        # Title and add button
        header_frame = tk.Frame(container, bg=self.colors['white'])
        header_frame.pack(fill=tk.X, pady=(0, 20))
        
        title_label = tk.Label(header_frame,
                              text="Work Experience",
                              font=('Segoe UI', 18, 'bold'),
                              fg=self.colors['dark'],
                              bg=self.colors['white'])
        title_label.pack(side=tk.LEFT)
        
        # Action buttons
        button_frame = tk.Frame(header_frame, bg=self.colors['white'])
        button_frame.pack(side=tk.RIGHT)
        
        self.create_action_button(button_frame, "➕ Add Job", self.add_work_experience, self.colors['success'])
        self.create_action_button(button_frame, "✏️ Edit", self.edit_work_experience, self.colors['primary'])
        self.create_action_button(button_frame, "🗑️ Delete", self.delete_work_experience, self.colors['danger'])
        
        # Work experience list with modern styling
        list_frame = tk.Frame(container, bg=self.colors['white'])
        list_frame.pack(fill=tk.BOTH, expand=True)
        
        self.work_listbox = tk.Listbox(list_frame,
                                      font=('Segoe UI', 11),
                                      height=12,
                                      relief='flat',
                                      bd=1,
                                      highlightthickness=1,
                                      highlightcolor=self.colors['primary'],
                                      selectbackground=self.colors['primary'],
                                      selectforeground=self.colors['white'])
        self.work_listbox.pack(fill=tk.BOTH, expand=True, pady=(0, 10))
        self.work_listbox.bind('<<ListboxSelect>>', self.on_work_select)
        
    def create_action_button(self, parent, text, command, color):
        """Create a modern action button"""
        btn = tk.Button(parent,
                       text=text,
                       command=command,
                       font=('Segoe UI', 9, 'bold'),
                       bg=color,
                       fg=self.colors['white'],
                       relief='flat',
                       borderwidth=0,
                       padx=15,
                       pady=8,
                       cursor='hand2')
        
        def on_enter(e):
            btn.configure(bg=self.lighten_color(color, 0.1))
        def on_leave(e):
            btn.configure(bg=color)
        
        btn.bind("<Enter>", on_enter)
        btn.bind("<Leave>", on_leave)
        btn.pack(side=tk.LEFT, padx=5)
        return btn
        
    def create_skills_tab(self):
        self.skills_frame = ttk.Frame(self.notebook, style='Card.TFrame')
        self.notebook.add(self.skills_frame, text="🛠️ Skills")
        
        # Main container
        container = tk.Frame(self.skills_frame, bg=self.colors['white'])
        container.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        
        # Header
        header_frame = tk.Frame(container, bg=self.colors['white'])
        header_frame.pack(fill=tk.X, pady=(0, 20))
        
        title_label = tk.Label(header_frame,
                              text="Technical Skills & Technologies",
                              font=('Segoe UI', 18, 'bold'),
                              fg=self.colors['dark'],
                              bg=self.colors['white'])
        title_label.pack(side=tk.LEFT)
        
        # Action buttons
        button_frame = tk.Frame(header_frame, bg=self.colors['white'])
        button_frame.pack(side=tk.RIGHT)
        
        self.create_action_button(button_frame, "➕ Add Skill", self.add_skill, self.colors['success'])
        self.create_action_button(button_frame, "🗑️ Remove", self.delete_skill, self.colors['danger'])
        
        # Skills listbox
        self.skills_listbox = tk.Listbox(container,
                                        font=('Segoe UI', 11),
                                        height=15,
                                        relief='flat',
                                        bd=1,
                                        highlightthickness=1,
                                        highlightcolor=self.colors['primary'],
                                        selectbackground=self.colors['primary'],
                                        selectforeground=self.colors['white'])
        self.skills_listbox.pack(fill=tk.BOTH, expand=True)
        
    def create_education_tab(self):
        self.education_frame = ttk.Frame(self.notebook, style='Card.TFrame')
        self.notebook.add(self.education_frame, text="🎓 Education")
        
        # Main container
        container = tk.Frame(self.education_frame, bg=self.colors['white'])
        container.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        
        # Placeholder content
        placeholder_frame = tk.Frame(container, bg=self.colors['light'])
        placeholder_frame.pack(expand=True, fill=tk.BOTH, padx=50, pady=50)
        
        icon_label = tk.Label(placeholder_frame,
                             text="🚧",
                             font=('Segoe UI', 48),
                             bg=self.colors['light'],
                             fg=self.colors['secondary'])
        icon_label.pack(pady=20)
        
        title_label = tk.Label(placeholder_frame,
                              text="Education Section",
                              font=('Segoe UI', 24, 'bold'),
                              bg=self.colors['light'],
                              fg=self.colors['dark'])
        title_label.pack(pady=10)
        
        desc_label = tk.Label(placeholder_frame,
                             text="This section is not yet populated in your JSON data.\nFuture updates will include education management.",
                             font=('Segoe UI', 12),
                             bg=self.colors['light'],
                             fg=self.colors['secondary'],
                             justify=tk.CENTER)
        desc_label.pack(pady=10)
        
    def export_to_pdf(self):
        """Export resume to PDF format"""
        if not self.resume_data:
            messagebox.showwarning("Warning", "No resume data loaded. Please load a JSON file first.")
            return
        
        self.update_status("Preparing PDF export...")
        
        # Update resume data with current form values
        self.collect_data()
        
        file_path = filedialog.asksaveasfilename(
            title="Save Resume PDF",
            defaultextension=".pdf",
            filetypes=[("PDF files", "*.pdf"), ("All files", "*.*")]
        )
        
        if file_path:
            try:
                self.create_pdf(file_path)
                self.update_status(f"✅ PDF exported successfully: {file_path}")
                messagebox.showinfo("Success", f"Resume exported to PDF successfully!\nSaved as: {file_path}")
            except ImportError:
                self.update_status("❌ PDF export failed - missing library")
                messagebox.showerror("Missing Library", 
                    "ReportLab library is required for PDF export.\n\n"
                    "Please install it using:\npip install reportlab")
            except Exception as e:
                self.update_status(f"❌ PDF export failed: {str(e)}")
                messagebox.showerror("Error", f"Failed to export PDF: {str(e)}")
    
    def update_status(self, message):
        """Update the status bar"""
        if hasattr(self, 'status_label'):
            self.status_label.config(text=message)
            self.root.update_idletasks()
    
    def create_pdf(self, file_path):
        """Create PDF using ReportLab"""
        from reportlab.lib.pagesizes import letter, A4
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.lib import colors
        from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
        
        # Create document
        doc = SimpleDocTemplate(file_path, pagesize=letter,
                              rightMargin=72, leftMargin=72,
                              topMargin=72, bottomMargin=18)
        
        # Get styles and create custom ones
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=12,
            alignment=TA_CENTER,
            textColor=colors.darkblue
        )
        
        subtitle_style = ParagraphStyle(
            'CustomSubtitle',
            parent=styles['Heading2'],
            fontSize=14,
            spaceAfter=6,
            alignment=TA_CENTER,
            textColor=colors.grey
        )
        
        section_style = ParagraphStyle(
            'SectionHeader',
            parent=styles['Heading2'],
            fontSize=16,
            spaceAfter=12,
            spaceBefore=20,
            textColor=colors.darkblue,
            borderWidth=1,
            borderColor=colors.darkblue,
            borderPadding=5
        )
        
        # Story (content) list
        story = []
        
        # Get data
        basics = self.resume_data.get("basics", {})
        location = basics.get("location", {})
        
        # Header - Name and Title
        if basics.get("name"):
            story.append(Paragraph(basics["name"], title_style))
        
        if basics.get("label"):
            story.append(Paragraph(basics["label"], subtitle_style))
        
        # Contact information
        contact_info = []
        if basics.get("email"):
            contact_info.append(basics["email"])
        if basics.get("phone"):
            contact_info.append(basics["phone"])
        if location.get("city"):
            contact_info.append(location["city"])
        
        if contact_info:
            story.append(Paragraph(" | ".join(contact_info), 
                                 ParagraphStyle('ContactInfo', 
                                              parent=styles['Normal'],
                                              alignment=TA_CENTER,
                                              spaceAfter=20)))
        
        # Summary
        if basics.get("summary"):
            story.append(Paragraph("PROFESSIONAL SUMMARY", section_style))
            clean_summary = self.clean_html(basics["summary"])
            story.append(Paragraph(clean_summary, styles['Normal']))
            story.append(Spacer(1, 12))
        
        # Objective
        if basics.get("objective"):
            story.append(Paragraph("CAREER OBJECTIVE", section_style))
            clean_objective = self.clean_html(basics["objective"])
            story.append(Paragraph(clean_objective, styles['Normal']))
            story.append(Spacer(1, 12))
        
        # Work Experience
        work_items = self.resume_data.get("work", [])
        if work_items:
            story.append(Paragraph("WORK EXPERIENCE", section_style))
            
            for work in work_items:
                # Company and position
                company = work.get("name", "")
                position = work.get("position", "")
                
                if company or position:
                    job_title = f"<b>{position}</b>" if position else ""
                    if company:
                        job_title += f" - {company}" if job_title else f"<b>{company}</b>"
                    story.append(Paragraph(job_title, styles['Heading3']))
                
                # Dates
                start_date = self.format_date(work.get("startDate", ""))
                end_date = self.format_date(work.get("endDate", "")) if work.get("endDate") else "Present"
                
                if start_date:
                    date_range = f"{start_date} - {end_date}"
                    story.append(Paragraph(date_range, 
                                         ParagraphStyle('DateStyle',
                                                      parent=styles['Normal'],
                                                      fontSize=10,
                                                      textColor=colors.grey,
                                                      spaceAfter=6)))
                
                # Job summary
                if work.get("summary"):
                    clean_summary = self.clean_html(work["summary"])
                    # Split by bullet points and format
                    lines = [line.strip() for line in clean_summary.split('•') if line.strip()]
                    for line in lines:
                        if line:
                            story.append(Paragraph(f"• {line}", styles['Normal']))
                
                story.append(Spacer(1, 12))
        
        # Skills
        skills = self.resume_data.get("skills", {})
        technologies = skills.get("technologies", [])
        if technologies:
            story.append(Paragraph("TECHNICAL SKILLS", section_style))
            
            skill_names = [tech.get("name", "") for tech in technologies if tech.get("name")]
            if skill_names:
                skills_text = " • ".join(skill_names)
                story.append(Paragraph(skills_text, styles['Normal']))
                story.append(Spacer(1, 12))
        
        # Build PDF
        doc.build(story)
    
    def format_date(self, date_string):
        """Format ISO date string to readable format"""
        if not date_string:
            return ""
        try:
            # Parse ISO format date
            date_obj = datetime.fromisoformat(date_string.replace('Z', '+00:00'))
            return date_obj.strftime("%B %Y")  # e.g., "January 2023"
        except:
            return date_string[:10] if len(date_string) >= 10 else date_string  # Fallback to YYYY-MM-DD
    
    def open_file(self):
        file_path = filedialog.askopenfilename(
            title="Open Resume JSON",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
        )
        if file_path:
            try:
                with open(file_path, "r", encoding="utf-8") as file:
                    self.resume_data = json.load(file)
                    self.current_file = file_path
                    self.populate_fields()
                    self.update_status(f"✅ File opened: {file_path}")
                    messagebox.showinfo("Success", "Resume data loaded successfully!")
            except Exception as e:
                self.update_status(f"❌ Failed to open file: {str(e)}")
                messagebox.showerror("Error", f"Failed to load file: {str(e)}")
    
    def save_file(self):
        if not self.current_file:
            self.save_as_file()
            return
        
        try:
            self.collect_data()
            with open(self.current_file, "w", encoding="utf-8") as file:
                json.dump(self.resume_data, file, indent=4, ensure_ascii=False)
            self.update_status(f"✅ File saved: {self.current_file}")
            messagebox.showinfo("Success", "Resume saved successfully!")
        except Exception as e:
            self.update_status(f"❌ Failed to save: {str(e)}")
            messagebox.showerror("Error", f"Failed to save file: {str(e)}")
    
    def save_as_file(self):
        file_path = filedialog.asksaveasfilename(
            title="Save Resume JSON",
            defaultextension=".json",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
        )
        if file_path:
            self.current_file = file_path
            self.save_file()
    
    def populate_fields(self):
        """Populate form fields with data from JSON"""
        if not self.resume_data:
            return
        
        basics = self.resume_data.get("basics", {})
        
        # Clear and populate basic info
        self.name_entry.delete(0, tk.END)
        self.name_entry.insert(0, basics.get("name", ""))
        
        self.label_entry.delete(0, tk.END)
        self.label_entry.insert(0, basics.get("label", ""))
        
        self.email_entry.delete(0, tk.END)
        self.email_entry.insert(0, basics.get("email", ""))
        
        self.phone_entry.delete(0, tk.END)
        self.phone_entry.insert(0, basics.get("phone", ""))
        
        location = basics.get("location", {})
        self.city_entry.delete(0, tk.END)
        self.city_entry.insert(0, location.get("city", ""))
        
        self.summary_text.delete(1.0, tk.END)
        self.summary_text.insert(1.0, self.clean_html(basics.get("summary", "")))
        
        self.objective_text.delete(1.0, tk.END)
        self.objective_text.insert(1.0, self.clean_html(basics.get("objective", "")))
        
        # Populate work experience
        self.work_listbox.delete(0, tk.END)
        work_items = self.resume_data.get("work", [])
        for work in work_items:
            display_text = f"{work.get('name', 'Unknown Company')} - {work.get('position', 'Unknown Position')}"
            self.work_listbox.insert(tk.END, display_text)
        
        # Populate skills
        self.skills_listbox.delete(0, tk.END)
        skills = self.resume_data.get("skills", {})
        technologies = skills.get("technologies", [])
        for tech in technologies:
            self.skills_listbox.insert(tk.END, tech.get("name", "Unknown Skill"))
    
    def collect_data(self):
        """Collect data from form fields back into resume_data"""
        if "basics" not in self.resume_data:
            self.resume_data["basics"] = {}
        
        basics = self.resume_data["basics"]
        basics["name"] = self.name_entry.get()
        basics["label"] = self.label_entry.get()
        basics["email"] = self.email_entry.get()
        basics["phone"] = self.phone_entry.get()
        
        if "location" not in basics:
            basics["location"] = {}
        basics["location"]["city"] = self.city_entry.get()
        
        basics["summary"] = f"<p>{self.summary_text.get(1.0, tk.END).strip()}</p>"
        basics["objective"] = f"<p>{self.objective_text.get(1.0, tk.END).strip()}</p>"
    
    def clean_html(self, text):
        """Remove simple HTML tags for display in text widgets"""
        if not text:
            return ""
        # Remove <p>, </p>, <br>, and &nbsp; tags
        text = re.sub(r'<p>|</p>|<br>|&nbsp;', '', text)
        text = re.sub(r'•\s*', '• ', text)  # Clean up bullet points
        return text.strip()
    
    def add_work_experience(self):
        self.work_dialog()
    
    def edit_work_experience(self):
        selection = self.work_listbox.curselection()
        if not selection:
            messagebox.showwarning("Warning", "Please select a work experience to edit")
            return
        self.work_dialog(selection[0])
    
    def delete_work_experience(self):
        selection = self.work_listbox.curselection()
        if not selection:
            messagebox.showwarning("Warning", "Please select a work experience to delete")
            return
        
        if messagebox.askyesno("Confirm", "Are you sure you want to delete this work experience?"):
            work_items = self.resume_data.get("work", [])
            del work_items[selection[0]]
            self.populate_fields()
    
    def work_dialog(self, edit_index=None):
        """Modern dialog for adding/editing work experience"""
        dialog = tk.Toplevel(self.root)
        dialog.title("✨ Work Experience")
        dialog.geometry("600x500")
        dialog.configure(bg=self.colors['white'])
        dialog.transient(self.root)
        dialog.grab_set()
        
        # Header
        header = tk.Frame(dialog, bg=self.colors['primary'], height=60)
        header.pack(fill=tk.X)
        header.pack_propagate(False)
        
        title = tk.Label(header,
                        text="💼 Add/Edit Work Experience",
                        font=('Segoe UI', 16, 'bold'),
                        fg=self.colors['white'],
                        bg=self.colors['primary'])
        title.pack(pady=20)
        
        # Content frame
        content = tk.Frame(dialog, bg=self.colors['white'])
        content.pack(fill=tk.BOTH, expand=True, padx=30, pady=20)
        
        work_data = {}
        if edit_index is not None:
            work_data = self.resume_data.get("work", [])[edit_index]
        
        # Company name
        self.create_dialog_field(content, "Company Name", 0)
        company_entry = self.last_dialog_entry
        company_entry.insert(0, work_data.get("name", ""))
        
        # Position
        self.create_dialog_field(content, "Position", 1)
        position_entry = self.last_dialog_entry
        position_entry.insert(0, work_data.get("position", ""))
        
        # Start date
        self.create_dialog_field(content, "Start Date (YYYY-MM-DD)", 2)
        start_entry = self.last_dialog_entry
        start_date = work_data.get("startDate", "")
        if start_date:
            start_entry.insert(0, start_date.split("T")[0])
        
        # End date
        self.create_dialog_field(content, "End Date (YYYY-MM-DD)", 3)
        end_entry = self.last_dialog_entry
        end_date = work_data.get("endDate")
        if end_date:
            end_entry.insert(0, end_date.split("T")[0])
        
        # Currently working checkbox
        currently_working = tk.BooleanVar()
        currently_working.set(work_data.get("isWorkingHere", False))
        
        check_frame = tk.Frame(content, bg=self.colors['white'])
        check_frame.grid(row=4, column=0, columnspan=2, sticky="w", pady=15)
        
        tk.Checkbutton(check_frame,
                      text="✅ Currently working here",
                      variable=currently_working,
                      font=('Segoe UI', 10),
                      bg=self.colors['white'],
                      fg=self.colors['dark']).pack(anchor='w')
        
        # Summary
        summary_label = tk.Label(content,
                                text="Job Summary",
                                font=('Segoe UI', 11, 'bold'),
                                fg=self.colors['dark'],
                                bg=self.colors['white'])
        summary_label.grid(row=5, column=0, sticky="nw", padx=5, pady=15)
        
        summary_text = tk.Text(content,
                              font=('Segoe UI', 10),
                              width=50,
                              height=6,
                              relief='flat',
                              bd=1,
                              highlightthickness=2,
                              highlightcolor=self.colors['primary'],
                              highlightbackground='#e2e8f0',
                              wrap=tk.WORD)
        summary_text.grid(row=5, column=1, padx=15, pady=15, sticky="ew")
        summary_text.insert(1.0, self.clean_html(work_data.get("summary", "")))
        
        def save_work():
            new_work = {
                "id": work_data.get("id", str(uuid.uuid4().hex[:16])),
                "name": company_entry.get(),
                "position": position_entry.get(),
                "url": work_data.get("url", ""),
                "startDate": f"{start_entry.get()}T04:00:00.000Z" if start_entry.get() else "",
                "isWorkingHere": currently_working.get(),
                "endDate": f"{end_entry.get()}T04:00:00.000Z" if end_entry.get() and not currently_working.get() else None,
                "highlights": work_data.get("highlights", []),
                "summary": f"<p>{summary_text.get(1.0, tk.END).strip()}</p>",
                "years": work_data.get("years", "")
            }
            
            if "work" not in self.resume_data:
                self.resume_data["work"] = []
            
            if edit_index is not None:
                self.resume_data["work"][edit_index] = new_work
            else:
                self.resume_data["work"].append(new_work)
            
            self.populate_fields()
            dialog.destroy()
        
        # Buttons
        button_frame = tk.Frame(dialog, bg=self.colors['white'])
        button_frame.pack(pady=20)
        
        save_btn = tk.Button(button_frame,
                            text="💾 Save",
                            command=save_work,
                            font=('Segoe UI', 11, 'bold'),
                            bg=self.colors['success'],
                            fg=self.colors['white'],
                            relief='flat',
                            borderwidth=0,
                            padx=30,
                            pady=10,
                            cursor='hand2')
        save_btn.pack(side=tk.LEFT, padx=10)
        
        cancel_btn = tk.Button(button_frame,
                              text="❌ Cancel",
                              command=dialog.destroy,
                              font=('Segoe UI', 11, 'bold'),
                              bg=self.colors['secondary'],
                              fg=self.colors['white'],
                              relief='flat',
                              borderwidth=0,
                              padx=30,
                              pady=10,
                              cursor='hand2')
        cancel_btn.pack(side=tk.LEFT, padx=10)
        
        # Configure grid weights
        content.grid_columnconfigure(1, weight=1)
    
    def create_dialog_field(self, parent, label_text, row):
        """Create a field for dialog"""
        label = tk.Label(parent,
                        text=label_text,
                        font=('Segoe UI', 11, 'bold'),
                        fg=self.colors['dark'],
                        bg=self.colors['white'])
        label.grid(row=row, column=0, sticky="w", padx=5, pady=15)
        
        entry = tk.Entry(parent,
                        font=('Segoe UI', 11),
                        width=40,
                        relief='flat',
                        bd=1,
                        highlightthickness=2,
                        highlightcolor=self.colors['primary'],
                        highlightbackground='#e2e8f0')
        entry.grid(row=row, column=1, padx=15, pady=15, sticky="ew")
        
        self.last_dialog_entry = entry
        return entry
    
    def on_work_select(self, event):
        # This could be used to show work details in the future
        pass
    
    def add_skill(self):
        skill_name = tk.simpledialog.askstring("Add Skill", "Enter skill name:")
        if skill_name:
            if "skills" not in self.resume_data:
                self.resume_data["skills"] = {"technologies": []}
            if "technologies" not in self.resume_data["skills"]:
                self.resume_data["skills"]["technologies"] = []
            
            self.resume_data["skills"]["technologies"].append({
                "name": skill_name,
                "level": 0
            })
            self.populate_fields()
            self.update_status(f"✅ Added skill: {skill_name}")
    
    def delete_skill(self):
        selection = self.skills_listbox.curselection()
        if not selection:
            messagebox.showwarning("Warning", "Please select a skill to delete")
            return
        
        if messagebox.askyesno("Confirm", "Are you sure you want to delete this skill?"):
            technologies = self.resume_data.get("skills", {}).get("technologies", [])
            if selection[0] < len(technologies):
                deleted_skill = technologies[selection[0]]["name"]
                del technologies[selection[0]]
                self.populate_fields()
                self.update_status(f"🗑️ Deleted skill: {deleted_skill}")

# Import for skill dialog
import tkinter.simpledialog

if __name__ == "__main__":
    root = tk.Tk()
    app = ResumeBuilder(root)
    root.mainloop()