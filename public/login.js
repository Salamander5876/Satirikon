document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('error-message');

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            // Сохранить данные в sessionStorage
            sessionStorage.setItem('username', data.username);
            sessionStorage.setItem('password', password);
            sessionStorage.setItem('role', data.role);

            // Перенаправить в зависимости от роли
            if (data.role === 'admin') {
                window.location.href = '/admin';
            } else {
                window.location.href = '/chat';
            }
        } else {
            errorDiv.textContent = '[ ACCESS DENIED ] Invalid credentials';
            errorDiv.classList.remove('hidden');

            setTimeout(() => {
                errorDiv.classList.add('hidden');
            }, 3000);
        }
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = '[ CONNECTION ERROR ] Please try again';
        errorDiv.classList.remove('hidden');
    }
});

// Добавить эффект ввода для полей
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('focus', () => {
        input.style.textShadow = '0 0 10px #ffffff';
    });

    input.addEventListener('blur', () => {
        input.style.textShadow = 'none';
    });
});
