document.addEventListener('DOMContentLoaded', function() {
    async function loadTicketData() {
        const statusEl = document.getElementById('ticket-status-text');
        const buyButton = document.getElementById('buy-ticket-button');

        if (!statusEl && !buyButton) return;

        try {
            const response = await fetch('database/tickets.json', { cache: 'no-store' });
            if (!response.ok) throw new Error('Network response not ok ' + response.status);
            const data = await response.json();

            const saleRaw = data && data['billetsalg-igang'];
            const onSale = (function normalizeYesNo(value) {
                if (typeof value === 'boolean') return value;
                if (typeof value === 'number') return value === 1;
                if (typeof value !== 'string') return false;
                const v = value.trim().toLowerCase();
                return v === 'ja' || v === 'yes' || v === 'true' || v === '1';
            })(saleRaw);

            const notForSaleText = data && data['Ikke til salg text'];
            const forSaleText = data && data['til salg text'];
            const ticketLink = data && data['billet link'];

            if (statusEl) {
                const fallback = statusEl.textContent || '';
                const text = onSale ? (forSaleText || 'Billetsalget er i gang!') : (notForSaleText || fallback);
                statusEl.innerHTML = text.replace(/\n/g, '<br>');
            }

            if (buyButton) {
                if (onSale) {
                    buyButton.style.display = 'inline-block';
                    buyButton.href = (typeof ticketLink === 'string' && ticketLink.trim()) ? ticketLink.trim() : '#';
                } else {
                    buyButton.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Could not load ticket data:', error);
        }
    }

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

    loadTicketData();

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