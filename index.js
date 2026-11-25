let cards = JSON.parse(localStorage.getItem('flashcards')) || [];
let currentReviewCards = [];
let currentCardIndex = 0;
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
    
    initApp();
    bindEvents();
});

function bindEvents() {
    document.querySelector('.theme-toggle').addEventListener('click', toggleTheme);
    
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId, this);
        });
    });
    
    document.getElementById('addCardBtn').addEventListener('click', addCard);
    document.getElementById('searchInput').addEventListener('input', renderList);
    document.getElementById('reviewFilter').addEventListener('change', startReview);
    document.getElementById('difficultyFilter').addEventListener('change', startReview);
    document.getElementById('flashcardContainer').addEventListener('click', flipCard);
    
    document.querySelectorAll('.review-controls .btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            markDifficulty(this.getAttribute('data-diff'));
        });
    });
    
    document.getElementById('startQuizBtn').addEventListener('click', startQuiz);
    document.getElementById('resetQuizBtn').addEventListener('click', resetQuiz);
    
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('importBtn').addEventListener('click', function() {
        document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', importData);
    document.getElementById('clearBtn').addEventListener('click', clearAllData);
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

function switchTab(tabId, btn) {
    document.querySelectorAll('.section').forEach(function(s) {
        s.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(function(b) {
        b.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');
    btn.classList.add('active');
    
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
    const categories = [...new Set(cards.map(function(c) { return c.category; }))];
    const datalist = document.getElementById('categoriesList');
    const reviewFilter = document.getElementById('reviewFilter');
    
    datalist.innerHTML = categories.map(function(c) {
        return '<option value="' + c + '">';
    }).join('');
    
    reviewFilter.innerHTML = '<option value="all">الكل</option>' + 
                             categories.map(function(c) {
                                 return '<option value="' + c + '">' + c + '</option>';
                             }).join('');
}

function updateStats() {
    const total = cards.length;
    const mastered = cards.filter(function(c) { return c.status === 'mastered'; }).length;
    const learning = total - mastered;
    const accuracy = total > 0 ? Math.round((mastered / total) * 100) : 0;
    
    document.getElementById('totalCount').innerText = total;
    document.getElementById('learningCount').innerText = learning;
    document.getElementById('masteredCount').innerText = mastered;
    document.getElementById('accuracyRate').innerText = accuracy + '%';
    
    const categoryStats = {};
    cards.forEach(function(c) {
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
    cards.forEach(function(c) {
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
    
    const filtered = cards.filter(function(c) {
        return c.en.toLowerCase().includes(search) || 
               c.ar.toLowerCase().includes(search) ||
               c.category.toLowerCase().includes(search);
    });

    if (filtered.length === 0) {
        list.innerHTML = '<p class="empty-state">لا توجد بطاقات</p>';
        return;
    }

    list.innerHTML = filtered.map(function(c) {
        const diffColor = c.difficulty === 'easy' ? 'var(--success)' : 
                          c.difficulty === 'medium' ? 'var(--warning)' : 'var(--danger)';
        const diffLabel = c.difficulty === 'easy' ? 'سهل' : 
                          c.difficulty === 'medium' ? 'متوسط' : 'صعب';
        const statusColor = c.status === 'mastered' ? 'var(--success)' : 'var(--primary)';
        const statusLabel = c.status === 'mastered' ? 'متقنة' : 'قيد التعلم';
        
        return '<div class="list-card">' +
               '<button class="edit-btn" data-id="' + c.id + '">تعديل</button>' +
               '<button class="delete-btn" data-id="' + c.id + '">حذف</button>' +
               '<h4>' + c.en + '</h4>' +
               '<p>' + c.ar + '</p>' +
               (c.example ? '<p style="font-size: 0.85rem; font-style: italic; margin-top: 5px;">"' + c.example + '"</p>' : '') +
               '<div>' +
               '<span class="badge">' + c.category + '</span>' +
               '<span class="badge" style="background: ' + diffColor + '">' + diffLabel + '</span>' +
               '<span class="badge" style="background: ' + statusColor + '">' + statusLabel + '</span>' +
               '</div>' +
               '</div>';
    }).join('');
    
    list.querySelectorAll('.edit-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            editCard(parseInt(this.getAttribute('data-id')));
        });
    });
    
    list.querySelectorAll('.delete-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            deleteCard(parseInt(this.getAttribute('data-id')));
        });
    });
}

function deleteCard(id) {
    if (confirm('هل أنت متأكد من حذف هذه البطاقة؟')) {
        cards = cards.filter(function(c) { return c.id !== id; });
        saveData();
        renderList();
    }
}

function editCard(id) {
    const card = cards.find(function(c) { return c.id === id; });
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
    
    currentReviewCards = cards.filter(function(c) { return c.status === 'learning'; });
    
    if (filter !== 'all') {
        currentReviewCards = currentReviewCards.filter(function(c) { return c.category === filter; });
    }
    
    if (diffFilter !== 'all') {
        currentReviewCards = currentReviewCards.filter(function(c) { return c.difficulty === diffFilter; });
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

function markDifficulty(difficulty) {
    const card = currentReviewCards[currentCardIndex];
    const originalCard = cards.find(function(c) { return c.id === card.id; });
    
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
    
    currentCardIndex++;
    showCurrentCard();
}

function startQuiz() {
    if (cards.length < 4) {
        alert('تحتاج إلى 4 كلمات على الأقل');
        return;
    }
    
    quizCards = cards.slice().sort(function() { return Math.random() - 0.5; }).slice(0, Math.min(10, cards.length));
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
    const otherCards = cards.filter(function(c) { return c.id !== currentCard.id; });
    
    while (options.length < 4 && otherCards.length > 0) {
        const randomIndex = Math.floor(Math.random() * otherCards.length);
        const randomCard = otherCards.splice(randomIndex, 1)[0];
        if (options.indexOf(randomCard.ar) === -1) {
            options.push(randomCard.ar);
        }
    }
    
    options = options.sort(function() { return Math.random() - 0.5; });
    
    const optionsDiv = document.getElementById('quizOptions');
    optionsDiv.innerHTML = '';
    
    options.forEach(function(opt) {
        const div = document.createElement('div');
        div.className = 'quiz-option';
        div.textContent = opt;
        div.addEventListener('click', function() {
            checkAnswer(opt, currentCard.ar);
        });
        optionsDiv.appendChild(div);
    });
    
    document.getElementById('quizProgress').innerText = 
        'السؤال ' + (quizIndex + 1) + ' من ' + quizCards.length;
}

function checkAnswer(selected, correct) {
    const options = document.querySelectorAll('.quiz-option');
    options.forEach(function(opt) {
        opt.style.pointerEvents = 'none';
        if (opt.textContent === correct) {
            opt.classList.add('correct');
        } else if (opt.textContent === selected && selected !== correct) {
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
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", "flashcards_backup_" + new Date().toISOString().split('T')[0] + ".json");
    document.body.appendChild(a);
    a.click();
    a.remove();
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
                    cards = cards.concat(imported);
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