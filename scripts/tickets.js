document.addEventListener('DOMContentLoaded', function() {
    // Apply purple color to header elements
    const applyPurpleTheme = () => {
        const logo = document.querySelector('#logo-container svg') || document.querySelector('svg');
        const dateText = document.querySelector('#date-text') || document.querySelector('.date-text');
        const dropdown = document.querySelector('select') || document.querySelector('.custom-dropdown .dropdown-trigger');

        if (logo) {
            logo.style.color = '#EFD0FF';
        }
        if (dateText) {
            dateText.style.color = '#EFD0FF';
        }
        if (dropdown) {
            dropdown.style.color = '#9D4DF0';
            dropdown.style.borderColor = '#9D4DF0';
            dropdown.style.backgroundColor = 'white';

            // If it's a select element, style the options too
            if (dropdown.tagName === 'SELECT') {
                const options = dropdown.querySelectorAll('option');
                options.forEach(option => {
                    option.style.color = '#9D4DF0';
                    option.style.backgroundColor = 'white';
                });
            }
        }
    };

    // Apply theme immediately if header exists
    applyPurpleTheme();

    // Also apply after header is inserted
    document.addEventListener('header-inserted', applyPurpleTheme);

    // Apply theme after a short delay as fallback
    setTimeout(applyPurpleTheme, 100);

    const form = document.getElementById('newsletter-form');
    const successMessage = document.getElementById('success-message');

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const emailInput = document.getElementById('email');

            const formData = {
                email: emailInput.value,
                timestamp: new Date().toISOString(),
                type: 'ticket-reminder'
            };

            console.log('Newsletter signup:', formData);

            form.style.display = 'none';
            successMessage.classList.add('show');

            setTimeout(() => {
                form.reset();
                form.style.display = 'flex';
                successMessage.classList.remove('show');
            }, 5000);
        });
    }
});