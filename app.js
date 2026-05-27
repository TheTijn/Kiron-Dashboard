/*
   Kiron Employee Central Dashboard - Esports Lobby HUD Engine
   Core logic for clocks, announcements slider, birthdays calculator,
   local-storage quick links, search dropdowns, canvas confetti,
   IT portal tabs, and interactive modals.
*/

document.addEventListener("DOMContentLoaded", () => {
  
  // ==========================================
  // 1. DATA STORES (Announcements, Birthdays, IT Dir)
  // ==========================================

  // Realistic Kiron announcements styled for a Game Software company
  const announcements = [
    {
      id: 1,
      title: "NHL 5-on-5 Launched to Global Gaming Markets!",
      category: "RELEASE LOG",
      tag: "VIRTUAL SPORTS",
      date: "MAY 26, 2026",
      author: "Game Dev Division",
      summary: "Deploying the excitement of real NHL teams to our virtual gaming portfolio. NHL 5-on-5 is live with advanced animations & physics.",
      content: `
        <p>We are thrilled to announce the official global release of our newest virtual sports title: <strong>NHL 5-on-5</strong>!</p>
        <p>Developed in close collaboration with official licensing partners, NHL 5-on-5 brings the high-octane, fast-paced action of professional ice hockey straight to our retail and online operator platforms. Key features include:</p>
        <ul>
          <li><strong>Authentic Matchups:</strong> Real team licenses, arenas, and historical stats.</li>
          <li><strong>Broadcast-Style Visuals:</strong> Cutting-edge 3D rendering and motion capture technology for ultra-realistic player movements.</li>
          <li><strong>Dynamic Physics Engine:</strong> Advanced puck physics for unpredictable, exciting gameplay.</li>
        </ul>
        <p>The game is now live across European, North American, and Latin American jurisdictions. Operators are already reporting double-digit engagement growth. Congratulations to the virtual sports engineering team for this milestone release!</p>
      `,
      bannerText: "NHL 5-on-5"
    },
    {
      id: 2,
      title: "Rodeo Crash Game: It's Crash with Character!",
      category: "RELEASE LOG",
      tag: "INSTANT WIN",
      date: "MAY 20, 2026",
      author: "Marketing Operations",
      summary: "Introducing Rodeo, our brand new crash-style instant win game. Combining high-frequency betting with high-performance gaming tech.",
      content: `
        <p>Hold on to your hats! Kiron has officially entered the character-driven crash games arena with <strong>RODEO</strong>.</p>
        <p>Rodeo represents a strategic expansion of our instant-win numbers game portfolio. Aimed at a younger demographic, this high-frequency, multiplayer multiplier game offers:</p>
        <ul>
          <li><strong>Unique Characters:</strong> Play as Buster the Bull or Cowboy Cody.</li>
          <li><strong>Social Elements:</strong> Real-time multiplayer leaderboards and in-game emotes.</li>
          <li><strong>Robust Performance:</strong> Built on our lightweight tech stack, optimized for low-connectivity regions.</li>
        </ul>
        <p>Rodeo is fully integrated into the BetMan platform, making it a plug-and-play solution for our current network of over 140 operators worldwide.</p>
      `,
      bannerText: "RODEO CRASH"
    },
    {
      id: 3,
      title: "Quarterly Town Hall Scheduled: Partnering in Practice",
      category: "COMMUNIQUE",
      tag: "GUILD BRIEFING",
      date: "MAY 18, 2026",
      author: "HR Operations",
      summary: "Join CEO Steven Sparre for our Q2 Town Hall meeting on Tuesday, June 2nd, to discuss performance, new partnerships, and Q3 roadmaps.",
      content: `
        <p>Our upcoming Q2 Corporate Town Hall is officially scheduled for <strong>Tuesday, June 2, 2026, at 14:00 GMT</strong>.</p>
        <p>Under our core philosophy of <em>"Partnership in Practice"</em>, CEO Steven Sparre and members of the executive committee will review Kiron’s record-breaking first-half performance and share key plans for the future. Agenda highlights include:</p>
        <ol>
          <li>Financial overview & commercial growth updates.</li>
          <li>Product roadmap updates for virtual football and numbers games.</li>
          <li>Introduction of new employee hires across Johannesburg and London hubs.</li>
          <li>Q&A session with the executive leadership team.</li>
        </ol>
        <p>A calendar invitation with a Microsoft Teams link has been sent to all staff members. Please submit your questions anonymously via the HR portal by Friday, May 29th.</p>
      `,
      bannerText: "TOWN HALL Q2"
    },
    {
      id: 4,
      title: "Legends Shootout Hockey Set to Break Retail Records",
      category: "COMMERCIAL",
      tag: "RETAIL ROLLOUT",
      date: "MAY 10, 2026",
      author: "Commercial Operations",
      summary: "Legends Shootout is rapidly rolling out in retail betting shops across Africa and Europe, showing outstanding early player KPIs.",
      content: `
        <p>We are excited to share exceptional early feedback on <strong>Legends Shootout Hockey</strong> in retail markets.</p>
        <p>Designed specifically to meet the high-volume demands of land-based betting shops, Legends Shootout brings fast-paced, 1-on-1 penalty shootout action to multi-screen retail setups. Its broadcast-style layout and simple betting markets make it highly intuitive for retail bettors.</p>
        <p>Early data from our pilot shops in Southern Europe shows a 35% increase in bet frequency compared to traditional pre-recorded games. A roll-out to another 1,500 retail terminals is scheduled for the coming weeks.</p>
      `,
      bannerText: "LEGENDS SHOOTOUT"
    }
  ];

  // Standard IT Directory List (Tab 2)
  const itDirectory = [
    { name: "Jira IT Support Desk", category: "Service Desk", desc: "Submit IT tickets for hardware, software, or account issues", link: "https://kiron.atlassian.net/servicedesk" },
    { name: "Global VPN Access", category: "Network", desc: "FortiClient VPN setup guides & authentication keys", link: "https://vpn.kironinteractive.com" },
    { name: "Office 365 Admin Center", category: "Admin Tools", desc: "Outlook, SharePoint, Teams permissions and group settings", link: "https://admin.microsoft.com" },
    { name: "Password Reset Portal", category: "Security", desc: "Self-service active directory password change tool", link: "https://password.kironinteractive.com" },
    { name: "1Password Corporate", category: "Security", desc: "Access team passwords, API tokens, and licenses securely", link: "https://kiron.1password.com" },
    { name: "Kiron Guest Wi-Fi", category: "Wi-Fi", desc: "Wi-Fi SSID: Kiron_Guest | Password: KironPartnership2026", link: "#" },
    { name: "Printer Installation Utility", category: "Office Setup", desc: "Drivers and configuration for office smart printers", link: "https://printers.kironinteractive.com" }
  ];

  // Simulated Employee Birthdays data (corporate directory records)
  const employees = [
    { name: "David Miller", dept: "Product & Design", roleTitle: "Director of Product", birthMonth: 4, birthDay: 27 }, // Today!
    { name: "Sarah Jenkins", dept: "QA & Testing", roleTitle: "QA Lead", birthMonth: 4, birthDay: 27 },      // Today!
    { name: "Thabo Molefe", dept: "Game Development", roleTitle: "Senior Game Developer", birthMonth: 4, birthDay: 28 },        // Tomorrow
    { name: "Elena Rostova", dept: "Virtual Sports Ops", roleTitle: "Operations Director", birthMonth: 4, birthDay: 30 }, // May 30
    { name: "Jonathan Vance", dept: "Sales & Accounts", roleTitle: "Account Director", birthMonth: 5, birthDay: 2 },   // June 2
    { name: "Sipho Dlamini", dept: "HR & Talent", roleTitle: "HR Manager", birthMonth: 5, birthDay: 3 },        // June 3
    { name: "Emily Watson", dept: "Executive Office", roleTitle: "Executive Assistant", birthMonth: 5, birthDay: 5 },     // June 5
    { name: "Amir Al-Farsi", dept: "Security & Ops", roleTitle: "Infrastructure Engineer", birthMonth: 3, birthDay: 15 },
    { name: "Chloe Dupont", dept: "Legal & Compliance", roleTitle: "Compliance Counsel", birthMonth: 7, birthDay: 18 },
    { name: "Marcus Thorne", dept: "Game Development", roleTitle: "Lead Shader Engineer", birthMonth: 9, birthDay: 12 },
    { name: "Linda Kruger", dept: "Financial Control", roleTitle: "Financial Controller", birthMonth: 10, birthDay: 8 }
  ];

  // Adjust month/day dynamically to ensure birthdays match active date
  const todayDate = new Date();
  const currentMonth = todayDate.getMonth(); // 0-indexed
  const currentDate = todayDate.getDate();

  employees[0].birthMonth = currentMonth;
  employees[0].birthDay = currentDate;

  employees[1].birthMonth = currentMonth;
  employees[1].birthDay = currentDate;

  const tomorrow = new Date(todayDate);
  tomorrow.setDate(todayDate.getDate() + 1);
  employees[2].birthMonth = tomorrow.getMonth();
  employees[2].birthDay = tomorrow.getDate();

  const in3Days = new Date(todayDate);
  in3Days.setDate(todayDate.getDate() + 3);
  employees[3].birthMonth = in3Days.getMonth();
  employees[3].birthDay = in3Days.getDate();

  const in5Days = new Date(todayDate);
  in5Days.setDate(todayDate.getDate() + 5);
  employees[4].birthMonth = in5Days.getMonth();
  employees[4].birthDay = in5Days.getDate();

  const in6Days = new Date(todayDate);
  in6Days.setDate(todayDate.getDate() + 6);
  employees[5].birthMonth = in6Days.getMonth();
  employees[5].birthDay = in6Days.getDate();

  // ==========================================
  // 2. TICKING CLOCK & HEADING GREETING
  // ==========================================
  const clockTime = document.getElementById("clock-time");
  const clockDate = document.getElementById("clock-date");
  const greetingText = document.getElementById("greeting-text");

  function updateClock() {
    const now = new Date();
    
    // Time format HH:MM:SS
    let hrs = now.getHours();
    let mins = now.getMinutes();
    let secs = now.getSeconds();
    
    hrs = hrs < 10 ? "0" + hrs : hrs;
    mins = mins < 10 ? "0" + mins : mins;
    secs = secs < 10 ? "0" + secs : secs;
    
    clockTime.textContent = `${hrs}:${mins}:${secs}`;
    
    // Date format e.g. "Wednesday, May 27, 2026"
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    clockDate.textContent = now.toLocaleDateString('en-US', options);

    // Dynamic Esports HUD Greetings
    const currentHour = now.getHours();
    if (currentHour < 12) {
      greetingText.textContent = "GOOD MORNING, PLAYER ONE // WELCOME BACK ☀️";
    } else if (currentHour < 18) {
      greetingText.textContent = "GOOD AFTERNOON, PLAYER ONE // LOBBY ACTIVE 🌤️";
    } else {
      greetingText.textContent = "GOOD EVENING, PLAYER ONE // CAMPAIGN MODE 🌙";
    }
  }
  
  updateClock();
  setInterval(updateClock, 1000);

  // ==========================================
  // 3. ANNOUNCEMENTS CAROUSEL SLIDER
  // ==========================================
  const eventsCarousel = document.getElementById("events-carousel");
  const carouselDots = document.getElementById("carousel-dots");
  const prevBtn = document.getElementById("prev-event");
  const nextBtn = document.getElementById("next-event");
  
  let currentSlide = 0;
  let slideInterval;

  function renderCarousel() {
    eventsCarousel.innerHTML = "";
    carouselDots.innerHTML = "";

    announcements.forEach((event, idx) => {
      // Build Slide Element
      const item = document.createElement("div");
      item.className = "carousel-item";
      item.innerHTML = `
        <div class="event-banner-img">
          <div class="event-banner-logo">${event.bannerText}</div>
          <div class="event-banner-type">${event.tag}</div>
        </div>
        <div class="event-details">
          <div class="event-meta-top">
            <span class="event-tag">${event.category}</span>
            <span class="event-date">${event.date}</span>
          </div>
          <h3>${event.title}</h3>
          <p class="event-descr">${event.summary}</p>
          <div class="event-readmore">
            <span>Launch Details</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
        </div>
      `;
      
      // Open announcement modal on click
      item.addEventListener("click", () => openEventModal(event));
      eventsCarousel.appendChild(item);

      // Build Indicator Dot
      const dot = document.createElement("div");
      dot.className = `indicator-dot ${idx === 0 ? "active" : ""}`;
      dot.addEventListener("click", () => goToSlide(idx));
      carouselDots.appendChild(dot);
    });
  }

  function goToSlide(slideIdx) {
    if (slideIdx < 0) {
      currentSlide = announcements.length - 1;
    } else if (slideIdx >= announcements.length) {
      currentSlide = 0;
    } else {
      currentSlide = slideIdx;
    }

    eventsCarousel.style.transform = `translateX(-${currentSlide * 100}%)`;

    // Update Dots
    const dots = carouselDots.querySelectorAll(".indicator-dot");
    dots.forEach((dot, idx) => {
      if (idx === currentSlide) {
        dot.classList.add("active");
      } else {
        dot.classList.remove("active");
      }
    });

    // Reset autoplay timer
    startAutoplay();
  }

  function startAutoplay() {
    clearInterval(slideInterval);
    slideInterval = setInterval(() => {
      goToSlide(currentSlide + 1);
    }, 8000);
  }

  prevBtn.addEventListener("click", () => goToSlide(currentSlide - 1));
  nextBtn.addEventListener("click", () => goToSlide(currentSlide + 1));

  eventsCarousel.addEventListener("mouseenter", () => clearInterval(slideInterval));
  eventsCarousel.addEventListener("mouseleave", startAutoplay);

  renderCarousel();
  startAutoplay();

  // ==========================================
  // 4. ANNOUNCEMENTS MODAL DETAILS SYSTEM
  // ==========================================
  const eventModal = document.getElementById("event-modal");
  const modalCategory = document.getElementById("modal-category");
  const modalDate = document.getElementById("modal-date");
  const modalAuthor = document.getElementById("modal-author");
  const modalTitle = document.getElementById("modal-title");
  const modalContent = document.getElementById("modal-content");
  const closeEventModalBtn = document.getElementById("close-event-modal");

  function openEventModal(event) {
    modalCategory.textContent = event.category;
    modalDate.textContent = event.date;
    modalAuthor.textContent = `TRANSMISSION BY: ${event.author}`;
    modalTitle.textContent = event.title;
    modalContent.innerHTML = event.content;
    
    eventModal.classList.remove("id-hide");
  }

  function closeEventModal() {
    eventModal.classList.add("id-hide");
  }

  closeEventModalBtn.addEventListener("click", closeEventModal);
  eventModal.addEventListener("click", (e) => {
    if (e.target === eventModal) closeEventModal();
  });

  // ==========================================
  // 5. PERSONAL QUICK LINKS & LOCAL STORAGE
  // ==========================================
  const linksContainer = document.getElementById("links-container");
  const addLinkBtn = document.getElementById("add-link-btn");
  const addLinkModal = document.getElementById("add-link-modal");
  const closeLinkModalBtn = document.getElementById("close-link-modal");
  const cancelLinkBtn = document.getElementById("cancel-link-btn");
  const addLinkForm = document.getElementById("add-link-form");

  // Load custom links from Local Storage
  let customLinks = JSON.parse(localStorage.getItem("kiron_dashboard_custom_links")) || [];

  function renderCustomLinks() {
    const existingCustomCards = linksContainer.querySelectorAll(".custom-link-card");
    existingCustomCards.forEach(c => c.remove());

    customLinks.forEach((link, index) => {
      const card = document.createElement("div");
      card.className = "link-card tool-link custom-link-card";
      
      let domain = "";
      try {
        domain = new URL(link.url).hostname;
      } catch (err) {
        domain = "link";
      }

      // Slot index padding
      const slotNum = 6 + index;
      const slotPadded = slotNum < 10 ? "0" + slotNum : slotNum;

      card.innerHTML = `
        <div class="slot-badge">[SLOT ${slotPadded}]</div>
        <a href="${link.url}" target="_blank" style="display:flex; align-items:center; gap:14px; width:100%; height:100%;">
          <div class="link-icon">
            <img src="https://www.google.com/s2/favicons?sz=64&domain=${domain}" alt="" style="width:18px; height:18px; border-radius:4px;" onerror="this.src='data:image/svg+xml;utf8,<svg viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%2310b981\\' stroke-width=\\'2\\' xmlns=\\'http://www.w3.org/2000/svg\\'><circle cx=\\'12\\' cy=\\'12\\' r=\\'10\\'/><path d=\\'M8 12h8\\'/></svg>'">
          </div>
          <div class="link-info">
            <h3>${link.title}</h3>
            <p>${link.desc || domain}</p>
          </div>
        </a>
        <div class="link-badge" style="background:#ecfdf5; color:#059669; border:0.5px solid rgba(16,185,129,0.3);">CRAFTED</div>
        <button class="link-delete-btn" data-index="${index}" title="Remove custom link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
        </button>
      `;

      const delBtn = card.querySelector(".link-delete-btn");
      delBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        deleteCustomLink(index);
      });

      linksContainer.appendChild(card);
    });
  }

  function deleteCustomLink(index) {
    customLinks.splice(index, 1);
    localStorage.setItem("kiron_dashboard_custom_links", JSON.stringify(customLinks));
    renderCustomLinks();
  }

  addLinkBtn.addEventListener("click", () => {
    addLinkModal.classList.remove("id-hide");
  });

  function closeLinkModal() {
    addLinkModal.classList.add("id-hide");
    addLinkForm.reset();
  }

  closeLinkModalBtn.addEventListener("click", closeLinkModal);
  cancelLinkBtn.addEventListener("click", closeLinkModal);
  addLinkModal.addEventListener("click", (e) => {
    if (e.target === addLinkModal) closeLinkModal();
  });

  addLinkForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("link-title").value;
    let url = document.getElementById("link-url").value;
    const desc = document.getElementById("link-desc").value;

    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    customLinks.push({ title, url, desc });
    localStorage.setItem("kiron_dashboard_custom_links", JSON.stringify(customLinks));
    
    closeLinkModal();
    renderCustomLinks();
  });

  renderCustomLinks();

  // ==========================================
  // 6. TRAVEL QUEST BRIEFING GENERATOR
  // ==========================================
  const travelModal = document.getElementById("travel-modal");
  const linkTravelTrigger = document.getElementById("link-travel-trigger");
  const closeTravelModalBtn = document.getElementById("close-travel-modal");
  const cancelTravelBtn = document.getElementById("cancel-travel-btn");
  const travelForm = document.getElementById("travel-request-form");
  const travelSummaryPane = document.getElementById("travel-summary-pane");
  const summaryCodeBlock = document.getElementById("summary-code-block");
  const editRequestBtn = document.getElementById("edit-request-btn");
  const copyRequestBtn = document.getElementById("copy-request-btn");

  linkTravelTrigger.addEventListener("click", (e) => {
    e.preventDefault();
    travelModal.classList.remove("id-hide");
    travelForm.classList.remove("id-hide");
    travelSummaryPane.classList.add("id-hide");
  });

  function closeTravelModal() {
    travelModal.classList.add("id-hide");
    travelForm.reset();
  }

  closeTravelModalBtn.addEventListener("click", closeTravelModal);
  cancelTravelBtn.addEventListener("click", closeTravelModal);
  travelModal.addEventListener("click", (e) => {
    if (e.target === travelModal) closeTravelModal();
  });

  travelForm.addEventListener("submit", (e) => {
    e.preventDefault();
    
    const travelerName = document.getElementById("traveler-name").value;
    const dept = document.getElementById("travel-dept").value;
    const destination = document.getElementById("travel-destination").value;
    const departure = document.getElementById("travel-departure").value;
    const returnDate = document.getElementById("travel-return").value;
    const purpose = document.getElementById("travel-purpose").value;
    const hotel = document.getElementById("travel-hotel").value;
    const budget = document.getElementById("travel-budget").value || "TBD";

    const depDateObj = new Date(departure);
    const retDateObj = new Date(returnDate);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const depFormatted = depDateObj.toLocaleDateString('en-US', options);
    const retFormatted = retDateObj.toLocaleDateString('en-US', options);

    const diffTime = Math.abs(retDateObj - depDateObj);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const summaryText = `===========================================================
KIRON INTERACTIVE // INTRANET TRAVEL REQUEST SUMMARY
===========================================================
REQUEST CODE: TRV-${Math.floor(100000 + Math.random() * 900000)}
DATE GENERATED: ${new Date().toLocaleDateString('en-US', options)}

REQUESTED BY:
- Employee Name: ${travelerName}
- Department:    ${dept}

TRAVEL ITINERARY:
- Destination:   ${destination}
- Departure:     ${depFormatted}
- Return Date:   ${retFormatted}
- Duration:      ${diffDays} Days

PURPOSE & JUSTIFICATION:
- Core Purpose: 
  "${purpose}"
  
LOGISTICS & ESTIMATES:
- Lodging / Hotel Required: ${hotel}
- Estimated Budget:         $${budget} USD

STATUS: COMPILED (Awaiting Management Approval)
===========================================================`;

    summaryCodeBlock.textContent = summaryText;

    travelForm.classList.add("id-hide");
    travelSummaryPane.classList.remove("id-hide");
  });

  editRequestBtn.addEventListener("click", () => {
    travelSummaryPane.classList.add("id-hide");
    travelForm.classList.remove("id-hide");
  });

  copyRequestBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(summaryCodeBlock.textContent).then(() => {
      const copySpan = copyRequestBtn.querySelector("span");
      copySpan.textContent = "REQUEST COPIED ✓";
      copyRequestBtn.style.background = "#84cc16";
      
      setTimeout(() => {
        copySpan.textContent = "Copy Request";
        copyRequestBtn.style.background = "";
      }, 2500);
    });
  });

  // ==========================================
  // 7. CELEBRATION LEADERBOARD & BIRTHDAYS
  // ==========================================
  const todaysBdaysContainer = document.getElementById("todays-birthdays");
  const upcomingBdaysContainer = document.getElementById("upcoming-birthdays");
  const bdayCountBadge = document.getElementById("bday-count-badge");

  let birthdayList = [];

  function calculateBirthdays() {
    todaysBdaysContainer.innerHTML = "";
    upcomingBdaysContainer.innerHTML = "";

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDate = today.getDate();

    let todayCount = 0;
    let upcomingCount = 0;

    birthdayList = [];

    employees.forEach(emp => {
      let bdayYear = today.getFullYear();
      let bdayDate = new Date(bdayYear, emp.birthMonth, emp.birthDay);
      
      if (bdayDate < new Date(bdayYear, currentMonth, currentDate - 1)) {
        bdayYear++;
        bdayDate = new Date(bdayYear, emp.birthMonth, emp.birthDay);
      }

      const diffTime = bdayDate - new Date(bdayYear === today.getFullYear() ? today.getFullYear() : today.getFullYear(), currentMonth, currentDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      birthdayList.push({
        ...emp,
        diffDays: diffDays === -0 ? 0 : diffDays,
        formattedDate: bdayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    });

    birthdayList.sort((a, b) => a.diffDays - b.diffDays);

    birthdayList.forEach(emp => {
      const initials = emp.name.split(" ").map(n => n[0]).join("");
      
      if (emp.diffDays === 0) {
        todayCount++;
        const item = document.createElement("div");
        item.className = "bday-item";
        item.innerHTML = `
          <div class="bday-item-left">
            <div class="bday-avatar">${initials}</div>
            <div class="bday-details">
              <span class="bday-name">${emp.name}</span>
              <span class="bday-dept">${emp.roleTitle} (${emp.dept})</span>
            </div>
          </div>
          <div class="bday-item-right">
            <button class="celebrate-btn" data-name="${emp.name}">
              <span>Celebrate</span> 🎉
            </button>
          </div>
        `;
        
        const celebrateBtn = item.querySelector(".celebrate-btn");
        celebrateBtn.addEventListener("click", () => {
          celebrateBday(emp.name, emp.roleTitle);
        });

        todaysBdaysContainer.appendChild(item);
      } else if (emp.diffDays <= 7) {
        upcomingCount++;
        const item = document.createElement("div");
        item.className = "bday-item";
        item.innerHTML = `
          <div class="bday-item-left">
            <div class="bday-avatar" style="background:#f1f5f9; color:#64748b;">${initials}</div>
            <div class="bday-details">
              <span class="bday-name">${emp.name}</span>
              <span class="bday-dept">${emp.roleTitle} (${emp.dept})</span>
            </div>
          </div>
          <div class="bday-item-right">
            <span class="bday-date-tag">${emp.diffDays === 1 ? 'Tomorrow' : emp.formattedDate}</span>
          </div>
        `;
        upcomingBdaysContainer.appendChild(item);
      }
    });

    if (todayCount === 0) {
      todaysBdaysContainer.innerHTML = `<div class="bday-empty">No birthdays today. Send them warm wishes anyway! 🎂</div>`;
    }
    if (upcomingCount === 0) {
      upcomingBdaysContainer.innerHTML = `<div class="bday-empty">No upcoming birthdays in the next 7 days.</div>`;
    }

    bdayCountBadge.textContent = `${todayCount} BIRTHDAYS TODAY`;
  }

  // Celebrate birthday triggers Confetti & dynamic notification
  function celebrateBday(name, roleTitle) {
    triggerConfetti();
    
    const popup = document.createElement("div");
    popup.style.position = "fixed";
    popup.style.bottom = "40px";
    popup.style.left = "50%";
    popup.style.transform = "translateX(-50%) translateY(20px)";
    popup.style.background = "#ffffff";
    popup.style.color = "#18181b";
    popup.style.padding = "16px 28px";
    popup.style.borderRadius = "16px";
    popup.style.border = "2px solid #84cc16";
    popup.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
    popup.style.zIndex = "10000";
    popup.style.fontFamily = "var(--font-primary, 'Inter', sans-serif)";
    popup.style.fontWeight = "600";
    popup.style.fontSize = "14px";
    popup.style.opacity = "0";
    popup.style.transition = "all 0.5s cubic-bezier(0.19, 1, 0.22, 1)";
    popup.style.textAlign = "center";
    
    popup.innerHTML = `🎂 <span style="color:#65a30d; font-weight:800; margin-right:4px;">HAPPY BIRTHDAY!</span> Wishing <strong>${name}</strong> (${roleTitle}) a fantastic celebration! 🎉`;
    
    document.body.appendChild(popup);
    
    setTimeout(() => {
      popup.style.opacity = "1";
      popup.style.transform = "translateX(-50%) translateY(0)";
    }, 50);

    setTimeout(() => {
      popup.style.opacity = "0";
      popup.style.transform = "translateX(-50%) translateY(-20px)";
      setTimeout(() => popup.remove(), 500);
    }, 4500);
  }

  calculateBirthdays();

  // ==========================================
  // 8. CANVAS CONFETTI HIGH-VELOCITY PARTICLE ENGINE
  // ==========================================
  const canvas = document.getElementById("confetti-canvas");
  const ctx = canvas.getContext("2d");
  
  let particles = [];
  let isConfettiActive = false;
  let confettiTimer = null;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  class ConfettiParticle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * -canvas.height - 20;
      this.size = Math.random() * 8 + 4;
      this.weight = Math.random() * 3 + 2; // Taller velocity
      
      this.speedX = Math.random() * 4 - 2;
      this.speedY = this.weight;
      
      // Cyber HUD Colors: Neon Emeralds, Golds, Pixel Whites
      const colors = ["#10b981", "#34d399", "#a7f3d0", "#059669", "#f59e0b", "#fbbf24", "#ffffff"];
      this.color = colors[Math.floor(Math.random() * colors.length)];
      
      this.rotation = Math.random() * 360;
      this.rotationSpeed = Math.random() * 6 - 3;

      // Particle shape type: 0 = Square, 1 = Hollow Polygon, 2 = Star
      this.type = Math.floor(Math.random() * 3);
    }

    update() {
      this.y += this.speedY;
      this.x += this.speedX;
      this.rotation += this.rotationSpeed;
      
      this.x += Math.sin(this.y / 20) * 0.4; // Wind sway

      if (this.y > canvas.height) {
        if (isConfettiActive) {
          this.y = -20;
          this.x = Math.random() * canvas.width;
        } else {
          const idx = particles.indexOf(this);
          particles.splice(idx, 1);
        }
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.fillStyle = this.color;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;

      if (this.type === 0) {
        // Flat Tech Block
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
      } else if (this.type === 1) {
        // Hollow Polygon Triangle/Hexagon
        ctx.beginPath();
        ctx.moveTo(0, -this.size / 2);
        ctx.lineTo(this.size / 2, this.size / 2);
        ctx.lineTo(-this.size / 2, this.size / 2);
        ctx.closePath();
        ctx.stroke();
      } else {
        // 4-pointed HUD Crosshair Star
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.lineTo(this.size * 0.3, -this.size * 0.3);
        ctx.lineTo(this.size, 0);
        ctx.lineTo(this.size * 0.3, this.size * 0.3);
        ctx.lineTo(0, this.size);
        ctx.lineTo(-this.size * 0.3, this.size * 0.3);
        ctx.lineTo(-this.size, 0);
        ctx.lineTo(-this.size * 0.3, -this.size * 0.3);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }
  }

  function triggerConfetti() {
    isConfettiActive = true;
    particles = [];
    
    // Add 160 cyber particles
    for (let i = 0; i < 160; i++) {
      particles.push(new ConfettiParticle());
    }

    if (confettiTimer) clearTimeout(confettiTimer);

    if (!confettiTimer) {
      animateConfetti();
    }

    confettiTimer = setTimeout(() => {
      isConfettiActive = false;
      confettiTimer = null;
    }, 4000);
  }

  function animateConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(p => {
      p.update();
      p.draw();
    });

    if (particles.length > 0) {
      requestAnimationFrame(animateConfetti);
    }
  }

  // ==========================================
  // 9. IT PORTAL TABS & OFFLINE DIRECTORY
  // ==========================================
  const itDirList = document.getElementById("it-dir-list");
  const dirSearchInput = document.getElementById("dir-search-input");

  function renderItDirectory(list = itDirectory) {
    itDirList.innerHTML = "";
    
    if (list.length === 0) {
      itDirList.innerHTML = `<div class="bday-empty">No matching system nodes found in directory database.</div>`;
      return;
    }

    list.forEach(item => {
      const dirCard = document.createElement("div");
      dirCard.className = "dir-item";
      dirCard.innerHTML = `
        <div class="dir-item-left">
          <div class="dir-item-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
          <div class="dir-item-info">
            <h4>${item.name.toUpperCase()}</h4>
            <p>${item.desc}</p>
          </div>
        </div>
        <div class="dir-item-right">
          <a href="${item.link}" target="_blank" class="dir-item-link-btn">
            <span>LAUNCH</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          </a>
        </div>
      `;
      itDirList.appendChild(dirCard);
    });
  }

  dirSearchInput.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = itDirectory.filter(item => 
      item.name.toLowerCase().includes(q) || 
      item.desc.toLowerCase().includes(q) || 
      item.category.toLowerCase().includes(q)
    );
    renderItDirectory(filtered);
  });

  renderItDirectory();

  // ==========================================
  // 10. GLOBAL HEADER SEARCH FILTER & POPUP
  // ==========================================
  const globalSearch = document.getElementById("global-search");
  const searchResults = document.getElementById("search-results");

  globalSearch.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase().trim();
    
    if (q.length === 0) {
      searchResults.classList.add("id-hide");
      searchResults.innerHTML = "";
      return;
    }

    searchResults.innerHTML = "";
    searchResults.classList.remove("id-hide");

    const matches = [];

    // Intranet Links Search
    const coreLinks = [
      { name: "Recruitment Request Form", link: "https://app.smartsheet.com/b/form/01980cee2a0e72f88d16b0f5ae66a2c6", type: "Corporate Form" },
      { name: "Travel Request", link: "#", type: "Active Request" },
      { name: "Submit Game Idea", link: "https://form.asana.com/?k=jIKkrFaNwK0FEuYNdFZCQg&d=294067408389481", type: "Asana Pitch" },
      { name: "Outlook Webmail", link: "https://outlook.office365.com", type: "Email Client" }
    ];

    coreLinks.forEach(l => {
      if (l.name.toLowerCase().includes(q)) {
        matches.push({ title: l.name, sub: l.type, url: l.link, isLink: true });
      }
    });

    customLinks.forEach(l => {
      if (l.title.toLowerCase().includes(q) || (l.desc && l.desc.toLowerCase().includes(q))) {
        matches.push({ title: l.title, sub: "Personal Link", url: l.url, isLink: true });
      }
    });

    itDirectory.forEach(l => {
      if (l.name.toLowerCase().includes(q) || l.desc.toLowerCase().includes(q)) {
        matches.push({ title: l.name, sub: `Directory: ${l.category}`, url: l.link, isLink: true });
      }
    });

    birthdayList.forEach(emp => {
      if (emp.name.toLowerCase().includes(q) || emp.dept.toLowerCase().includes(q)) {
        matches.push({ title: emp.name, sub: `Birthday: ${emp.formattedDate} (${emp.roleTitle})`, url: "#", isBday: true });
      }
    });

    if (matches.length === 0) {
      searchResults.innerHTML = `<div class="search-no-results">No matches found.<br/><span style="font-size:11px;color:#71717a;">Press Enter to search on Google</span></div>`;
      return;
    }

    const groupTitle = document.createElement("div");
    groupTitle.className = "search-results-group-title";
    groupTitle.textContent = "Intra-System Matches Detected";
    searchResults.appendChild(groupTitle);

    matches.slice(0, 5).forEach(m => {
      const item = document.createElement("div");
      item.className = "search-result-item";
      
      let iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path></svg>`;
      if (m.isBday) {
        iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
      }

      item.innerHTML = `
        ${iconSvg}
        <div class="search-result-info">
          <span class="search-result-title">${m.title.toUpperCase()}</span>
          <span class="search-result-desc">${m.sub}</span>
        </div>
      `;

      item.addEventListener("click", () => {
        if (m.isLink) {
          if (m.url === "#") {
            linkTravelTrigger.click();
          } else {
            window.open(m.url, "_blank");
          }
        } else if (m.isBday) {
          const targetItem = Array.from(document.querySelectorAll(".bday-name"))
            .find(span => span.textContent.toLowerCase().includes(m.title.toLowerCase()));
          
          if (targetItem) {
            targetItem.scrollIntoView({ behavior: 'smooth' });
            const parentCard = targetItem.closest(".bday-item");
            if (parentCard) {
              parentCard.style.borderColor = "#10b981";
              parentCard.style.boxShadow = "var(--shadow-glow)";
              setTimeout(() => {
                parentCard.style.borderColor = "";
                parentCard.style.boxShadow = "";
              }, 3000);
            }
          }
        }
        
        searchResults.classList.add("id-hide");
        globalSearch.value = "";
      });

      searchResults.appendChild(item);
    });
  });

  globalSearch.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const q = globalSearch.value.trim();
      if (q.length > 0) {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, "_blank");
        globalSearch.value = "";
        searchResults.classList.add("id-hide");
      }
    }
  });

  document.addEventListener("click", (e) => {
    if (e.target !== globalSearch && e.target !== searchResults && !searchResults.contains(e.target)) {
      searchResults.classList.add("id-hide");
    }
  });

});
