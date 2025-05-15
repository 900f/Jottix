document.addEventListener('DOMContentLoaded', async () => {
    // Check if .stats section exists
    const statsSection = document.querySelector('.stats');
    if (!statsSection) {
        console.log('Stats section not found on this page');
        return;
    }

    // Function to animate counter from 0 to target value
    function animateCounter(element, target) {
        if (target === '0+') {
            element.textContent = '0+';
            return;
        }
        let start = 0;
        const duration = 1000; // 1 second animation
        const increment = target / (duration / 16); // 60fps
        const updateCounter = () => {
            start += increment;
            if (start >= target) {
                element.textContent = Math.floor(target);
                return;
            }
            element.textContent = Math.floor(start);
            requestAnimationFrame(updateCounter);
        };
        requestAnimationFrame(updateCounter);
    }

    // Function to update counters
    async function updateCounters() {
        try {
            // Fetch user count (Teen Writers)
            console.log('Fetching user count from /api/users/count');
            const userResponse = await fetch('/api/users/count');
            if (!userResponse.ok) throw new Error(`HTTP error ${userResponse.status}`);
            const userData = await userResponse.json();
            console.log('User count response:', userData);
            const userCountElement = document.querySelector('.stats div:nth-child(1) h3');
            const userCount = userData.count >= 0 ? userData.count : '0+';
            animateCounter(userCountElement, userCount);

            // Fetch post count (Stories Shared)
            console.log('Fetching post count from /api/posts/count');
            const postResponse = await fetch('/api/posts/count');
            if (!postResponse.ok) throw new Error(`HTTP error ${postResponse.status}`);
            const postData = await postResponse.json();
            console.log('Post count response:', postData);
            const postCountElement = document.querySelector('.stats div:nth-child(2) h3');
            const postCount = postData.count >= 0 ? postData.count : '0+';
            animateCounter(postCountElement, postCount);

            // Fetch unique countries (Countries)
            console.log('Fetching country count from /api/users/countries');
            const countryResponse = await fetch('/api/users/countries');
            if (!countryResponse.ok) throw new Error(`HTTP error ${countryResponse.status}`);
            const countryData = await countryResponse.json();
            console.log('Country count response:', countryData);
            const countryCountElement = document.querySelector('.stats div:nth-child(3) h3');
            const countryCount = countryData.count >= 0 ? countryData.count : '0+';
            animateCounter(countryCountElement, countryCount);

            // Monthly Readers (placeholder, no endpoint)
            console.log('No endpoint for Monthly Readers, using placeholder');
            const monthlyReadersElement = document.querySelector('.stats div:nth-child(4) h3');
            animateCounter(monthlyReadersElement, '0+');
        } catch (error) {
            console.error('Error fetching stats:', error.message, error.stack);
            // Fallback to "0+" for all counters on error
            document.querySelectorAll('.stats div h3').forEach(counter => {
                counter.textContent = '0+';
            });
        }
    }

    // Run the counter update
    updateCounters();
});