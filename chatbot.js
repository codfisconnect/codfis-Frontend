document.addEventListener("DOMContentLoaded", function () {
    const button = document.getElementById("chatbot-button");
    const chatbot = document.getElementById("chatbot-window");
    const response = document.getElementById("chatbot-response");
    const closeBtn = document.querySelector(".chatbot-close");

    let businessState = { step: 0, answers: {} };

    function openChatbot() {
        chatbot.style.display = "block";
        chatbot.setAttribute("aria-hidden", "false");
        setTimeout(() => {
            chatbot.querySelector('.chatbot-card').style.transform = 'translateY(0)';
        }, 10);
    }

    function closeChatbot() {
        chatbot.style.display = "none";
        chatbot.setAttribute("aria-hidden", "true");
    }

    // Toggle when clicking the floating button
    button.addEventListener("click", function (ev) {
        ev.stopPropagation();
        if (chatbot.style.display === "block") closeChatbot();
        else showMain();
    });

    // Close via header close button
    closeBtn && closeBtn.addEventListener('click', function (ev) {
        ev.stopPropagation();
        closeChatbot();
    });

    // Don't close when clicking inside
    chatbot.addEventListener("click", function (ev) { ev.stopPropagation(); });

    // Close when clicking outside
    document.addEventListener("click", function () { closeChatbot(); });

    // Helpers to render UI
    function clearResponse() { response.innerHTML = ''; }

    const courses = {
        AI: 'Learn practical AI concepts and tools to build real-world AI solutions.',
        Python: 'Learn Python from fundamentals to practical application development.',
        Java: 'Build a strong foundation in Java programming and application development.',
        'Web Development': 'Learn how to build modern websites and web applications.',
        'Software Testing': 'Learn manual and automation testing with practical real-world skills.',
        'Cloud & Infrastructure Engineering': 'Learn cloud infrastructure, deployment, networking, and DevOps fundamentals.',
        'Data Analytics': 'Learn how to work with data, analytics tools, visualization, and business insights.',
        AWS: 'Learn AWS cloud services and practical cloud deployment skills.',
        'Scrum Master': 'Learn Scrum, Agile practices, team collaboration, and the role of a Scrum Master.'
    };

    const fees = {
        'Software Testing': '₹18,000',
        'Data Analytics': '₹16,000',
        AWS: '₹25,000',
        Java: '₹4,000',
        Python: '₹4,000',
        'Cloud & Infrastructure Engineering': '₹30,000',
        'Scrum Master': '₹10,000'
    };

    const solutionsList = [
        'Business Website Development',
        'Web Application Development',
        'Mobile Application Development',
        'AI-Powered Applications',
        'AI Integration & Automation',
        'Custom Software Development',
        'Cloud & Infrastructure',
        'Data Analytics',
        'Enterprise Solutions',
        'Digital Transformation'
    ];

    function showMain() {
        // reset business state
        businessState = { step: 0, answers: {} };
        // ensure main view shown
        clearResponse();
        const mainView = chatbot.querySelector('[data-view="main"]');
        if (mainView) mainView.style.display = 'block';
        response.innerHTML = '';
        openChatbot();
    }

    function renderCourses() {
        const grid = document.createElement('div');
        grid.className = 'courses-grid';
        Object.keys(courses).forEach(name => {
            const item = document.createElement('div');
            item.className = 'course-item';
            item.setAttribute('data-course', name);
            item.innerHTML = `<div class="course-title">${name}</div>`;
            grid.appendChild(item);
        });
        clearResponse();
        response.appendChild(grid);
    }

    function renderCourseDetail(name) {
        clearResponse();
        const card = document.createElement('div');
        card.className = 'chat-card';
        card.innerHTML = `<div class="course-title">${name}</div><div class="course-desc">${courses[name]}</div>`;
        const row = document.createElement('div');
        row.className = 'back-row';
        const back = document.createElement('button');
        back.className = 'back-btn';
        back.setAttribute('data-action','back-to-courses');
        back.textContent = 'Back';
        row.appendChild(back);
        response.appendChild(card);
        response.appendChild(row);
    }

    function renderFees() {
        clearResponse();
        const container = document.createElement('div');
        container.className = 'fees-grid';
        // show listed fees
        Object.keys(fees).forEach(name => {
            const card = document.createElement('div');
            card.className = 'chat-card fee-card';
            card.innerHTML = `<div style="flex:1"><div class='fee-name'>${name}</div><div style='font-size:13px;color:#475569'>Course fee</div></div><div style='text-align:right'><div class='fee-amount'>${fees[name]}</div><button class='fee-cta' data-action='ask' data-course='${name}'>Ask about this course</button></div>`;
            container.appendChild(card);
        });

        // other courses
        const other = document.createElement('div');
        other.className = 'chat-card';
        other.innerHTML = '<strong>Other courses</strong><div style="margin-top:8px;color:#475569">For other courses, please contact us for current fee.</div>';
        container.appendChild(other);

        response.appendChild(container);
    }

    function renderSolutions() {
        clearResponse();
        const grid = document.createElement('div');
        grid.className = 'solutions-grid';
        solutionsList.forEach(name => {
            const card = document.createElement('div');
            card.className = 'solution-card chat-card';
            card.setAttribute('data-solution', name);
            card.innerHTML = `<div style='font-weight:700'>${name}</div><div style='margin-top:6px;color:#475569;font-size:13px'>Learn how we help businesses with ${name.toLowerCase()}.</div>`;
            grid.appendChild(card);
        });
        response.appendChild(grid);
    }

    function renderContact() {
        clearResponse();
        const cont = document.createElement('div');
        cont.className = 'contact-grid';
        cont.innerHTML = `
            <div class="contact-card chat-card">
                <div class="contact-left">
                    <div style="font-weight:700">Email</div>
                    <a class="contact-link" href="mailto:HR@codfis.com">HR@codfis.com</a>
                </div>
            </div>
            <div class="contact-card chat-card">
                <div class="contact-left">
                    <div style="font-weight:700">Phone</div>
                    <a class="contact-link" href="tel:+919884770747">+91 98847 70747</a>
                </div>
            </div>
            <div class="contact-card chat-card">
                <div class="contact-left">
                    <div style="font-weight:700">WhatsApp</div>
                    <a class="contact-link" href="https://wa.me/919884770747" target="_blank">Message on WhatsApp</a>
                </div>
            </div>
        `;
        response.appendChild(cont);
    }

    // Business website lead flow
    const businessQuestions = [
        {
            key: 'businessType',
            question: 'What kind of business do you run?',
            options: ['Restaurant / Food','Education / Training','Healthcare','Real Estate','Retail / Shop','Professional Services','Manufacturing','Startup','Other']
        },
        {
            key: 'websiteType',
            question: 'What type of website are you looking for?',
            options: ['Business Website','E-commerce Website','Portfolio Website','Landing Page','Booking / Appointment Website','Not Sure']
        },
        {
            key: 'mainGoal',
            question: 'What is your main goal for the website?',
            options: ['Get more customers','Generate leads','Sell products online','Showcase my business','Accept bookings','Build an online presence','Not Sure']
        }
    ];

    function renderBusinessStep() {
        clearResponse();
        const step = businessState.step;
        if (step < businessQuestions.length) {
            const q = businessQuestions[step];
            const card = document.createElement('div');
            card.className = 'chat-card';
            const title = document.createElement('div');
            title.style.fontWeight = 700;
            title.textContent = q.question;
            card.appendChild(title);
            const opts = document.createElement('div');
            opts.className = 'business-options';
            q.options.forEach(opt => {
                const b = document.createElement('button');
                b.className = 'chatbot-btn';
                b.setAttribute('data-action','business-select');
                b.setAttribute('data-value', opt);
                b.textContent = opt;
                opts.appendChild(b);
            });
            card.appendChild(opts);
            response.appendChild(card);
            // back
            if (step > 0) {
                const back = document.createElement('button');
                back.className = 'back-btn';
                back.setAttribute('data-action','business-back');
                back.textContent = 'Back';
                response.appendChild(back);
            }
        } else {
            // finished -> show contact form to collect user details
            clearResponse();
            const form = document.createElement('form');
            form.className = 'chat-enquiry-form';
            form.innerHTML = `
              <div class="chat-card"><div style="font-weight:700">Almost done — please share your contact details</div></div>
              <div class="chat-card"><input name="name" placeholder="Your full name" required/></div>
              <div class="chat-card"><input name="company" placeholder="Company name (optional)"/></div>
              <div class="chat-card"><input name="email" type="email" placeholder="Email" required/></div>
              <div class="chat-card"><input name="phone" type="tel" placeholder="Phone" required/></div>
              <div class="chat-card"><label style="font-size:13px">Preferred solution</label><select name="preferredSolution">
                <option value="">--Select--</option>
                ${solutionsList.map(s=>`<option value="${s}">${s}</option>`).join('')}
              </select></div>
              <div class="chat-card"><label style="font-size:13px">Project type</label><select name="projectType">
                <option>Business Website</option><option>Landing Page</option><option>Web Application</option><option>Mobile Application</option><option>AI Integration</option><option>Automation</option><option>Custom Software</option>
              </select></div>
              <div class="chat-card"><textarea name="additional" placeholder="Additional requirements (optional)"></textarea></div>
              <div class="chat-card"><button class="chatbot-btn" type="submit">Submit Enquiry</button></div>
            `;
            response.appendChild(form);

            form.addEventListener('submit', function(ev){
                ev.preventDefault();
                const data = new FormData(form);
                const payload = {
                    name: data.get('name'),
                    company: data.get('company'),
                    email: data.get('email'),
                    phone: data.get('phone'),
                    businessType: businessState.answers.businessType || '',
                    requirement: businessState.answers.websiteType || '',
                    preferredSolution: data.get('preferredSolution') || '',
                    projectType: data.get('projectType') || '',
                    additional: data.get('additional') || ''
                };

                // submit to local API
                fetch('/api/enquiries', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                .then(res => {
                    if (!res.ok) throw new Error('Failed to send enquiry');
                    return res.json();
                })
                .then(result => {
                    clearResponse();
                    const thanks = document.createElement('div');
                    thanks.className = 'chat-card';
                    thanks.innerHTML = `<div style='font-weight:700'>Thank you! We received your enquiry.</div><div style='margin-top:8px;color:#475569'>Our team will review your request and contact you shortly.</div>`;
                    response.appendChild(thanks);
                })
                .catch(err => {
                    alert('Failed to submit enquiry. Please try again.');
                    console.error(err);
                });
            });
        }
    }

    // Delegate clicks inside chatbot for buttons
    chatbot.addEventListener('click', function (ev) {
        const btn = ev.target.closest('button');
        if (!btn) return;
        const action = btn.getAttribute('data-action');

        switch (action) {
            case 'courses':
                chatbot.querySelector('[data-view="main"]').style.display = 'none';
                renderCourses();
                break;
            case 'fees':
                chatbot.querySelector('[data-view="main"]').style.display = 'none';
                renderFees();
                break;
            case 'solutions':
                chatbot.querySelector('[data-view="main"]').style.display = 'none';
                renderSolutions();
                break;
            case 'contact':
                chatbot.querySelector('[data-view="main"]').style.display = 'none';
                renderContact();
                break;
            case 'business':
                chatbot.querySelector('[data-view="main"]').style.display = 'none';
                businessState = { step: 0, answers: {} };
                renderBusinessStep();
                break;
            case 'menu':
                showMain();
                break;
            case 'ask':
                // emulate asking: open contact
                renderContact();
                break;
            case 'business-select':
                const val = btn.getAttribute('data-value');
                const key = businessQuestions[businessState.step].key;
                businessState.answers[key] = val;
                businessState.step++;
                renderBusinessStep();
                break;
            case 'business-back':
                businessState.step = Math.max(0, businessState.step - 1);
                renderBusinessStep();
                break;
            case 'back-to-courses':
                renderCourses();
                break;
            default:
                // handle clicking course items
                const courseItem = ev.target.closest('.course-item');
                if (courseItem) {
                    const name = courseItem.getAttribute('data-course');
                    renderCourseDetail(name);
                }
                break;
        }
    });

    // allow clicking a course name or its container
    response.addEventListener('click', function (ev) {
        const courseItem = ev.target.closest('.course-item');
        if (courseItem) {
            const name = courseItem.getAttribute('data-course');
            renderCourseDetail(name);
        }
    });

    // Listen for page CTAs that should open the chatbot to a specific flow
    document.addEventListener('click', function (ev) {
        const el = ev.target.closest('[data-open-chat]');
        if (!el) return;
        ev.preventDefault();
        const target = el.getAttribute('data-open-chat');
        // open main chatbot
        showMain();
        // small timeout to allow UI to open
        setTimeout(() => {
            if (target === 'business') {
                chatbot.querySelector('[data-view="main"]').style.display = 'none';
                businessState = { step: 0, answers: {} };
                renderBusinessStep();
            } else if (target === 'solutions') {
                chatbot.querySelector('[data-view="main"]').style.display = 'none';
                renderSolutions();
            } else if (target === 'courses') {
                chatbot.querySelector('[data-view="main"]').style.display = 'none';
                renderCourses();
            }
        }, 80);
    });

    // initialize (do not auto-open; user opens intentionally)
});