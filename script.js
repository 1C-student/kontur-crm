const themeToggle = document.getElementById('themeToggle');
const body = document.body;

if (localStorage.getItem('theme') === 'dark') {
    body.classList.add('dark');
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark');
        localStorage.setItem('theme', body.classList.contains('dark') ? 'dark' : 'light');
    });
}

window.addEventListener('scroll', () => {
    const header = document.getElementById('header');
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const closeMenuBtn = document.getElementById('closeMenuBtn');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.add('open');
    });
}

if (closeMenuBtn) {
    closeMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
    });
}

document.querySelectorAll('.mobile-menu-links a').forEach(link => {
    link.addEventListener('click', () => {
        if (mobileMenu) mobileMenu.classList.remove('open');
    });
});

const revealElements = document.querySelectorAll('.scroll-reveal');

const revealOnScroll = () => {
    revealElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        if (rect.top < windowHeight - 100) {
            el.classList.add('visible');
        }
    });
};

window.addEventListener('scroll', revealOnScroll);
revealOnScroll();

document.querySelectorAll('a[href^="#"]:not(.open-modal)').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === "#" || !href) return;
        const target = document.querySelector(href);
        if (target && href !== "#request-modal" && href !== "#authModal" && href !== "#aboutModal" && href !== "#helpModal") {
            e.preventDefault();
            window.scrollTo({
                top: target.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

const typedTitle = document.getElementById('typedTitle');
let index = 0;
const fullText = 'КОНТУР';

function typeWriter() {
    if (index < fullText.length) {
        typedTitle.textContent += fullText.charAt(index);
        index++;
        setTimeout(typeWriter, 150);
    } else {
        typedTitle.style.borderRight = 'none';
    }
}

if (typedTitle) {
    typedTitle.textContent = '';
    typeWriter();
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        console.log('Модальное окно открыто:', modalId);
    } else {
        console.error('Модальное окно не найдено:', modalId);
    }
}

function closeModals() {
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
}

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', closeModals);
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeModals();
    }
});

// Обработчики для кнопок открытия модальных окон
document.querySelectorAll('.open-modal, a[href="#request-modal"], a[href="#authModal"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const href = btn.getAttribute('href');
        if (href) {
            const modalId = href.substring(1);
            openModal(modalId);
        }
    });
});

// ===== КНОПКИ "О ПРОГРАММЕ" И "РУКОВОДСТВО ПОЛЬЗОВАТЕЛЯ" =====

function openModalWithClose(modalId) {
    closeModals();
    openModal(modalId);
}

const aboutBtn = document.getElementById('aboutBtn');
if (aboutBtn) {
    aboutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openModalWithClose('aboutModal');
    });
}

const helpBtn = document.getElementById('helpBtn');
if (helpBtn) {
    helpBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openModalWithClose('helpModal');
    });
}

const mobileAboutBtn = document.getElementById('mobileAboutBtn');
if (mobileAboutBtn) {
    mobileAboutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (mobileMenu) mobileMenu.classList.remove('open');
        openModalWithClose('aboutModal');
    });
}

const mobileHelpBtn = document.getElementById('mobileHelpBtn');
if (mobileHelpBtn) {
    mobileHelpBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (mobileMenu) mobileMenu.classList.remove('open');
        openModalWithClose('helpModal');
    });
}

let currentUser = null;

async function api(action, data) {
    try {
        const res = await fetch(`api.php?action=${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    } catch (error) {
        console.error('API error:', error);
        return { success: false, message: 'Ошибка соединения с сервером' };
    }
}

async function checkAuthStatus() {
    try {
        const res = await fetch('api.php?action=me');
        const data = await res.json();
        if (data.success) {
            currentUser = data.user;
            updateUIForUser();
        } else {
            currentUser = null;
            updateUIForUser();
        }
    } catch (error) {
        console.error('Auth check error:', error);
        currentUser = null;
        updateUIForUser();
    }
}

function updateUIForUser() {
    const authBtn = document.getElementById('authBtn');
    const mobileAuthBtn = document.getElementById('mobileAuthBtn');
    
    if (currentUser) {
        if (authBtn) {
            authBtn.textContent = `${currentUser.name} (выйти)`;
            authBtn.onclick = (e) => { e.preventDefault(); logout(); };
        }
        if (mobileAuthBtn) {
            mobileAuthBtn.textContent = `${currentUser.name} (выйти)`;
            mobileAuthBtn.onclick = (e) => { e.preventDefault(); logout(); };
        }
        
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) {
            if (currentUser.role === 'admin') {
                adminPanel.style.display = 'block';
                loadAdminRequests();
            } else {
                adminPanel.style.display = 'none';
            }
        }
    } else {
        if (authBtn) {
            authBtn.textContent = "Войти";
            authBtn.onclick = (e) => { e.preventDefault(); openModal('authModal'); };
        }
        if (mobileAuthBtn) {
            mobileAuthBtn.textContent = "Войти";
            mobileAuthBtn.onclick = (e) => { e.preventDefault(); openModal('authModal'); };
        }
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) adminPanel.style.display = 'none';
    }
}

async function logout() {
    await api('logout', {});
    currentUser = null;
    updateUIForUser();
    location.reload();
}

document.querySelectorAll('.tab-link').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        document.getElementById(tab.dataset.tab + 'Form').classList.add('active');
    });
});

const doLoginBtn = document.getElementById('doLogin');
if (doLoginBtn) {
    doLoginBtn.addEventListener('click', async () => {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const res = await api('login', { email, password });
        if (res.success) {
            closeModals();
            await checkAuthStatus();
        } else {
            const msg = document.getElementById('loginMessage');
            if (msg) msg.textContent = res.message;
        }
    });
}

const doRegisterBtn = document.getElementById('doRegister');
if (doRegisterBtn) {
    doRegisterBtn.addEventListener('click', async () => {
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const res = await api('register', { name, email, password });
        const msg = document.getElementById('regMessage');
        if (msg) {
            msg.textContent = res.message;
            if (res.success) {
                setTimeout(() => { closeModals(); }, 2000);
            }
        }
    });
}

const requestForm = document.getElementById('requestForm');
if (requestForm) {
    requestForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) {
            alert('Войдите или зарегистрируйтесь, чтобы оставить заявку');
            openModal('authModal');
            return;
        }
        
        const name = document.getElementById('reqName').value;
        const phone = document.getElementById('reqPhone').value;
        const service = document.getElementById('reqService').value;
        const comment = document.getElementById('reqComment').value;
        const res = await api('create_request', { name, phone, service, comment });
        const msg = document.getElementById('requestMessage');
        if (msg) {
            msg.textContent = res.message;
            if (res.success) {
                setTimeout(() => {
                    closeModals();
                    requestForm.reset();
                    if (msg) msg.textContent = '';
                }, 2000);
            }
        }
    });
}

async function loadAdminRequests() {
    const statusFilter = document.getElementById('statusFilter');
    const orderFilter = document.getElementById('orderFilter');
    const status = statusFilter ? statusFilter.value : 'all';
    const order = orderFilter ? orderFilter.value : 'desc';
    
    try {
        const res = await fetch(`api.php?action=admin_requests&status=${status}&order=${order}`);
        const data = await res.json();
        
        if (data.success) {
            renderRequestsTable(data.requests);
        }
    } catch (error) {
        console.error('Load requests error:', error);
    }
}

function renderRequestsTable(requests) {
    const container = document.getElementById('requestsTable');
    if (!container) return;
    
    if (requests.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:2rem;">Нет заявок</p>';
        return;
    }
    
    let html = `<table><thead><tr><th>ID</th><th>Клиент</th><th>Телефон</th><th>Услуга</th><th>Комментарий</th><th>Статус</th><th>Действие</th></tr></thead><tbody>`;
    
    for (const req of requests) {
        html += `
            <tr>
                <td>${req.id}</td>
                <td>${escapeHtml(req.name)}<br><small>${escapeHtml(req.user_email)}</small></td>
                <td>${escapeHtml(req.phone)}</td>
                <td>${escapeHtml(req.service)}</td>
                <td>${escapeHtml(req.comment || '')}</td>
                <td><span class="status-badge status-${req.status}">${getStatusText(req.status)}</span></td>
                <td>
                    <select onchange="updateStatus(${req.id}, this.value)" class="edit-status">
                        <option value="new" ${req.status === 'new' ? 'selected' : ''}>Новая</option>
                        <option value="processed" ${req.status === 'processed' ? 'selected' : ''}>В обработке</option>
                        <option value="completed" ${req.status === 'completed' ? 'selected' : ''}>Выполнена</option>
                        <option value="canceled" ${req.status === 'canceled' ? 'selected' : ''}>Отменена</option>
                    </select>
                </td>
            </tr>
        `;
    }
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

function getStatusText(status) {
    const statuses = {
        'new': 'Новая',
        'processed': 'В обработке',
        'completed': 'Выполнена',
        'canceled': 'Отменена'
    };
    return statuses[status] || status;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

window.updateStatus = async function(id, newStatus) {
    const res = await api('update_status', { id, status: newStatus });
    if (res.success) {
        loadAdminRequests();
    } else {
        alert('Ошибка: ' + res.message);
    }
};

const applyFilters = document.getElementById('applyFilters');
if (applyFilters) {
    applyFilters.addEventListener('click', () => {
        loadAdminRequests();
    });
}

const logoutAdmin = document.getElementById('logoutAdmin');
if (logoutAdmin) {
    logoutAdmin.addEventListener('click', () => {
        logout();
    });
}

checkAuthStatus();