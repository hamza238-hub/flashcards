const APP_PASSWORD = "hamza||1234";
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 30000;
const SESSION_TIMEOUT = 30 * 60 * 1000;

let cards = JSON.parse(localStorage.getItem('flashcards')) || [];
let currentReviewCards = [];
let currentCardIndex = 0;
let loginAttempts = 0;
let isLocked = false;
let sessionTimer;
let quizCards = [];
let quizIndex = 0;
let quizScore = 0;

document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const themeBtn = document.querySelector('.theme-toggle');
    if (themeBtn) {
        themeBtn.innerText = savedTheme === 'dark' ? '☀️' : '🌙';
    }
    
    const toggleBtn = document.getElementById('togglePasswordBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            const input = document.getElementById('passwordInput');
            if (input.type === 'password') {
                input.type = 'text';
                toggleBtn.innerText = 'إخفاء';
            } else {
                input.type = 'password';
                toggleBtn.innerText = 'إظهار';
            }
        });
    }
    
    const passwordInput = document.getElementById('passwordInput');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                login();
            }
        });
    }
    
    checkAuth();
    
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        initApp();
    }
    
    document.addEventListener('click', function() {
        if (sessionStorage.getItem('isLoggedIn') === 'true') {
            resetSessionTimer();
        }
    });
});

function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const loginTime = sessionStorage.getItem('loginTime');
    
    if (isLoggedIn === 'true' && loginTime) {
        const timeDiff = Date.now() - parseInt(loginTime);
        if (timeDiff < SESSION_TIMEOUT) {
            showMainApp();
            resetSessionTimer();
            return;
        } else {
            logout(true);
            return;
        }
    }
    showLoginScreen();
}

function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
}

function showMainApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
}

function login() {
    if (isLocked) {
        alert('تم قفل تسجيل الدخول مؤقتاً');
        return;
    }

    const password = document.getElementById('passwordInput').value;
    const errorMsg = document.getElementById('loginError');
    
    if (!password) {
        errorMsg.textContent = 'الرجاء إدخال كلمة المرور';
        return;
    }

    if (password === APP_PASSWORD) {
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('loginTime', Date.now().toString());
        errorMsg.textContent = '';
        loginAttempts = 0;
        showMainApp();
        initApp();
        resetSessionTimer();
    } else {
        loginAttempts++;
        const attemptsRemaining = MAX_ATTEMPTS - loginAttempts;
        
        if (loginAttempts >= MAX_ATTEMPTS) {
            isLocked = true;
            errorMsg.textContent = 'تم قفل تسجيل الدخول';
            
            setTimeout(function() {
                isLocked = false;
                loginAttempts = 0;
                errorMsg.textContent = '';
            }, LOCKOUT_TIME);
        } else {
            errorMsg.textContent = 'كلمة المرور غير صحيحة. المحاولات المتبقية: ' + attemptsRemaining;
        }
        
        document.getElementById('passwordInput').value = '';
    }
}

function logout(autoLogout = false) {
    if (autoLogout || confirm('هل تريد تسجيل الخروج؟')) {
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('loginTime');
        document.getElementById('passwordInput').value = '';
        clearTimeout(sessionTimer);
        showLoginScreen();
    }
}

function resetSessionTimer() {
    clearTimeout(sessionTimer);
    sessionTimer = setTimeout(function() {
        alert('انتهت الجلسة');
        logout(true);
    }, SESSION_TIMEOUT);
}

function initApp() {
    updateCategories();
    renderList();
    updateStats();
}

function saveData() {
    localStorage.setItem('flashcards', JSON.stringify(cards));
    updateCategories();
    updateStats();
}

function switchTab(tabId, event) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
    
    if (tabId === 'review') startReview();
    if (tabId === 'manage') renderList();
    if (tabId === 'stats') updateStats();
}

function addCard() {
    const en = document.getElementById('enWord').value.trim();
    const ar = document.getElementById('arWord').value.trim();
    const example = document.getElementById('example').value.trim();
    const cat = document.getElementById('category').value.trim() || 'عام';
    const difficulty = document.getElementById('difficulty').value;

    if (!en || !ar) {
        alert('الرجاء إدخال الكلمة والمعنى');
        return;
    }

    cards.push({
        id: Date.now(),
        en: en,
        ar: ar,
        example: example,
        category: cat,
        difficulty: difficulty,
        status: 'learning',
        reviews: 0,
        correctAnswers: 0,
        dateAdded: new Date().toLocaleDateString('ar-EG')
    });

    saveData();
    
    document.getElementById('enWord').value = '';
    document.getElementById('arWord').value = '';
    document.getElementById('example').value = '';
    document.getElementById('category').value = '';
    document.getElementById('difficulty').value = 'medium';
    
    alert('تمت إضافة البطاقة بنجاح');
}

function updateCategories() {
    const categories = [...new Set(cards.map(c => c.category))];
    const datalist = document.getElementById('categoriesList');
    const reviewFilter = document.getElementById('reviewFilter');
    
    datalist.innerHTML = categories.map(c => '<option value="' + c + '">').join('');
    reviewFilter.innerHTML = '<option value="all">الكل</option>' + 
                             categories.map(c => '<option value="' + c + '">' + c + '</option>').join('');
}

function updateStats() {
    const total = cards.length;
    const mastered = cards.filter(c => c.status === 'mastered').length;
    const learning = total - mastered;
    const accuracy = total > 0 ? Math.round((mastered / total) * 100) : 0;
    
    document.getElementById('totalCount').innerText = total;
    document.getElementById('learningCount').innerText = learning;
    document.getElementById('masteredCount').innerText = mastered;
    document.getElementById('accuracyRate').innerText = accuracy + '%';
    
    const categoryStats = {};
    cards.forEach(c => {
        if (!categoryStats[c.category]) {
            categoryStats[c.category] = 0;
        }
        categoryStats[c.category]++;
    });
    
    const categoryStatsDiv = document.getElementById('categoryStats');
    if (total === 0) {
        categoryStatsDiv.innerHTML = '<p style="color: var(--text-light);">لا توجد بيانات</p>';
    } else {
        categoryStatsDiv.innerHTML = Object.entries(categoryStats).map(function(entry) {
            const cat = entry[0];
            const count = entry[1];
            const percentage = (count / total) * 100;
            return '<div class="stat-bar">' +
                   '<div class="stat-bar-label">' +
                   '<span>' + cat + '</span>' +
                   '<span>' + count + ' (' + Math.round(percentage) + '%)</span>' +
                   '</div>' +
                   '<div class="stat-bar-fill">' +
                   '<div class="stat-bar-progress" style="width: ' + percentage + '%"></div>' +
                   '</div>' +
                   '</div>';
        }).join('');
    }
    
    const difficultyStats = { easy: 0, medium: 0, hard: 0 };
    cards.forEach(c => {
        difficultyStats[c.difficulty]++;
    });
    
    const difficultyStatsDiv = document.getElementById('difficultyStats');
    if (total === 0) {
        difficultyStatsDiv.innerHTML = '<p style="color: var(--text-light);">لا توجد بيانات</p>';
    } else {
        const labels = { easy: 'سهل', medium: 'متوسط', hard: 'صعب' };
        difficultyStatsDiv.innerHTML = Object.entries(difficultyStats).map(function(entry) {
            const diff = entry[0];
            const count = entry[1];
            const percentage = (count / total) * 100;
            return '<div class="stat-bar">' +
                   '<div class="stat-bar-label">' +
                   '<span>' + labels[diff] + '</span>' +
                   '<span>' + count + ' (' + Math.round(percentage) + '%)</span>' +
                   '</div>' +
                   '<div class="stat-bar-fill">' +
                   '<div class="stat-bar-progress" style="width: ' + percentage + '%"></div>' +
                   '</div>' +
                   '</div>';
        }).join('');
    }
}

function renderList() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const list = document.getElementById('cardsList');
    
    const filtered = cards.filter(c => 
        c.en.toLowerCase().includes(search) || 
        c.ar.toLowerCase().includes(search) ||
        c.category.toLowerCase().includes(search)
    );

    if (filtered.length === 0) {
        list.innerHTML = '<p class="empty-state">لا توجد بطاقات</p>';
        return;
    }

    list.innerHTML = filtered.map(c => 
        '<div class="list-card">' +
        '<button class="edit-btn" onclick="editCard(' + c.id + ')">تعديل</button>' +
        '<button class="delete-btn" onclick="deleteCard(' + c.id + ')">حذف</button>' +
        '<h4>' + c.en + '</h4>' +
        '<p>' + c.ar + '</p>' +
        (c.example ? '<p style="font-size: 0.85rem; font-style: italic; margin-top: 5px;">"' + c.example + '"</p>' : '') +
        '<div>' +
        '<span class="badge">' + c.category + '</span>' +
        '<span class="badge" style="background: ' + (c.difficulty === 'easy' ? 'var(--success)' : c.difficulty === 'medium' ? 'var(--warning)' : 'var(--danger)') + '">' +
        (c.difficulty === 'easy' ? 'سهل' : c.difficulty === 'medium' ? 'متوسط' : 'صعب') +
        '</span>' +
        '<span class="badge" style="background: ' + (c.status === 'mastered' ? 'var(--success)' : 'var(--primary)') + '">' +
        (c.status === 'mastered' ? 'متقنة' : 'قيد التعلم') +
        '</span>' +
        '</div>' +
        '</div>'
    ).join('');
}

function deleteCard(id) {
    if (confirm('هل أنت متأكد من حذف هذه البطاقة؟')) {
        cards = cards.filter(c => c.id !== id);
        saveData();
        renderList();
    }
}

function editCard(id) {
    const card = cards.find(c => c.id === id);
    if (!card) return;
    
    const newEn = prompt('الكلمة بالإنجليزية:', card.en);
    if (newEn === null) return;
    
    const newAr = prompt('المعنى:', card.ar);
    if (newAr === null) return;
    
    const newExample = prompt('مثال على الاستخدام:', card.example || '');
    if (newExample === null) return;
    
    const newCategory = prompt('التصنيف:', card.category);
    if (newCategory === null) return;
    
    card.en = newEn;
    card.ar = newAr;
    card.example = newExample;
    card.category = newCategory;
    
    saveData();
    renderList();
    alert('تم تحديث البطاقة');
}

function startReview() {
    const filter = document.getElementById('reviewFilter').value;
    const diffFilter = document.getElementById('difficultyFilter').value;
    
    currentReviewCards = cards.filter(c => c.status === 'learning');
    
    if (filter !== 'all') {
        currentReviewCards = currentReviewCards.filter(c => c.category === filter);
    }
    
    if (diffFilter !== 'all') {
        currentReviewCards = currentReviewCards.filter(c => c.difficulty === diffFilter);
    }

    currentCardIndex = 0;
    showCurrentCard();
}

function showCurrentCard() {
    const area = document.getElementById('reviewArea');
    const empty = document.getElementById('emptyReview');
    
    if (currentReviewCards.length === 0 || currentCardIndex >= currentReviewCards.length) {
        area.style.display = 'none';
        empty.style.display = 'block';
        return;
    }

    area.style.display = 'block';
    empty.style.display = 'none';
    
    const card = currentReviewCards[currentCardIndex];
    document.getElementById('cardFront').innerText = card.en;
    document.getElementById('cardBack').innerText = card.ar;
    document.getElementById('cardCat').innerText = card.category;
    document.getElementById('cardExample').innerText = card.example ? '"' + card.example + '"' : '';
    
    const diffLabels = { easy: 'سهل', medium: 'متوسط', hard: 'صعب' };
    document.getElementById('cardDiff').innerText = diffLabels[card.difficulty];
    
    document.getElementById('flashcard').classList.remove('flipped');
    document.getElementById('reviewProgress').innerText = 
        'البطاقة ' + (currentCardIndex + 1) + ' من ' + currentReviewCards.length;
}

function flipCard() {
    document.getElementById('flashcard').classList.toggle('flipped');
}

function speakWord() {
    const card = currentReviewCards[currentCardIndex];
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(card.en);
        utterance.lang = 'en-US';
        utterance.rate = 0.8;
        speechSynthesis.speak(utterance);
    } else {
        alert('المتصفح لا يدعم ميزة النطق');
    }
}

function markDifficulty(difficulty) {
    const card = currentReviewCards[currentCardIndex];
    const originalCard = cards.find(c => c.id === card.id);
    
    if (originalCard) {
        originalCard.reviews++;
        originalCard.difficulty = difficulty;
        
        if (difficulty === 'easy') {
            originalCard.correctAnswers++;
            if (originalCard.correctAnswers >= 3) {
                originalCard.status = 'mastered';
            }
        }
        
        saveData();
    }
    
    nextCard();
}

function nextCard() {
    currentCardIndex++;
    showCurrentCard();
}

function startQuiz() {
    if (cards.length < 4) {
        alert('تحتاج إلى 4 كلمات على الأقل');
        return;
    }
    
    quizCards = [...cards].sort(() => Math.random() - 0.5).slice(0, Math.min(10, cards.length));
    quizIndex = 0;
    quizScore = 0;
    
    document.getElementById('quizSetup').style.display = 'none';
    document.getElementById('quizArea').style.display = 'block';
    document.getElementById('quizResult').style.display = 'none';
    
    showQuizQuestion();
}

function showQuizQuestion() {
    if (quizIndex >= quizCards.length) {
        showQuizResult();
        return;
    }
    
    const currentCard = quizCards[quizIndex];
    document.getElementById('quizQuestion').innerText = currentCard.en;
    
    let options = [currentCard.ar];
    const otherCards = cards.filter(c => c.id !== currentCard.id);
    
    while (options.length < 4 && otherCards.length > 0) {
        const randomIndex = Math.floor(Math.random() * otherCards.length);
        const randomCard = otherCards.splice(randomIndex, 1)[0];
        if (!options.includes(randomCard.ar)) {
            options.push(randomCard.ar);
        }
    }
    
    options = options.sort(() => Math.random() - 0.5);
    
    const optionsDiv = document.getElementById('quizOptions');
    optionsDiv.innerHTML = options.map(function(opt) {
        const safeOpt = opt.replace(/'/g, "\\'").replace(/"/g, '\\"');
        const safeCorrect = currentCard.ar.replace(/'/g, "\\'").replace(/"/g, '\\"');
        return '<div class="quiz-option" onclick="checkAnswer(\'' + safeOpt + '\', \'' + safeCorrect + '\')">' + opt + '</div>';
    }).join('');
    
    document.getElementById('quizProgress').innerText = 
        'السؤال ' + (quizIndex + 1) + ' من ' + quizCards.length;
}

function checkAnswer(selected, correct) {
    const options = document.querySelectorAll('.quiz-option');
    options.forEach(function(opt) {
        opt.style.pointerEvents = 'none';
        if (opt.innerText === correct) {
            opt.classList.add('correct');
        } else if (opt.innerText === selected && selected !== correct) {
            opt.classList.add('wrong');
        }
    });
    
    if (selected === correct) {
        quizScore++;
    }
    
    setTimeout(function() {
        quizIndex++;
        showQuizQuestion();
    }, 1500);
}

function showQuizResult() {
    document.getElementById('quizArea').style.display = 'none';
    document.getElementById('quizResult').style.display = 'block';
    
    const percentage = Math.round((quizScore / quizCards.length) * 100);
    document.getElementById('quizScore').innerHTML = 
        quizScore + ' / ' + quizCards.length + '<br>' +
        '<span style="font-size: 1.5rem;">' + percentage + '%</span>';
}

function resetQuiz() {
    document.getElementById('quizSetup').style.display = 'block';
    document.getElementById('quizArea').style.display = 'none';
    document.getElementById('quizResult').style.display = 'none';
}

function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cards, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "flashcards_backup_" + new Date().toISOString().split('T')[0] + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                if (confirm('هل تريد استبدال البيانات الحالية؟')) {
                    cards = imported;
                } else {
                    cards = [...cards, ...imported];
                }
                saveData();
                renderList();
                alert('تم استيراد البيانات بنجاح');
            } else {
                alert('ملف غير صالح');
            }
        } catch (err) {
            alert('حدث خطأ في قراءة الملف');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function clearAllData() {
    if (confirm('تحذير: سيتم مسح جميع البيانات!')) {
        if (confirm('هل أنت متأكد تماماً؟')) {
            cards = [];
            saveData();
            renderList();
            alert('تم مسح جميع البيانات');
        }
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const themeBtn = document.querySelector('.theme-toggle');
    themeBtn.innerText = newTheme === 'dark' ? '☀️' : '🌙';
}