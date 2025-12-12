(() => {
  'use strict';

  // Rate limiting configuration
  const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
  const MAX_SUBMISSIONS_PER_WINDOW = 3; // Max 3 submissions per hour
  const MIN_TIME_BETWEEN_SUBMISSIONS = 60 * 1000; // Minimum 1 minute between submissions

  const form = document.getElementById('contact-form');
  if (!form) return;

  // Create message container
  const createMessage = (text, type) => {
    const message = document.createElement('div');
    message.className = `form-message form-message--${type}`;
    message.textContent = text;
    message.setAttribute('role', 'alert');
    return message;
  };

  // Remove existing messages
  const removeMessages = () => {
    const existing = form.querySelectorAll('.form-message');
    existing.forEach(msg => msg.remove());
  };

  // Check rate limiting
  const checkRateLimit = () => {
    const now = Date.now();
    const storageKey = 'contact_form_submissions';
    
    try {
      const stored = localStorage.getItem(storageKey);
      const submissions = stored ? JSON.parse(stored) : [];

      // Remove old submissions outside the time window
      const recentSubmissions = submissions.filter(
        timestamp => now - timestamp < RATE_LIMIT_WINDOW
      );

      // Check if too many submissions in the window
      if (recentSubmissions.length >= MAX_SUBMISSIONS_PER_WINDOW) {
        const oldestSubmission = recentSubmissions[0];
        const timeUntilNext = RATE_LIMIT_WINDOW - (now - oldestSubmission);
        const minutesUntilNext = Math.ceil(timeUntilNext / (60 * 1000));
        return {
          allowed: false,
          message: `Too many submissions. Please try again in ${minutesUntilNext} minute${minutesUntilNext !== 1 ? 's' : ''}.`
        };
      }

      // Check minimum time between submissions
      if (recentSubmissions.length > 0) {
        const lastSubmission = recentSubmissions[recentSubmissions.length - 1];
        const timeSinceLast = now - lastSubmission;
        
        if (timeSinceLast < MIN_TIME_BETWEEN_SUBMISSIONS) {
          const secondsRemaining = Math.ceil((MIN_TIME_BETWEEN_SUBMISSIONS - timeSinceLast) / 1000);
          return {
            allowed: false,
            message: `Please wait ${secondsRemaining} second${secondsRemaining !== 1 ? 's' : ''} before submitting again.`
          };
        }
      }

      return { allowed: true };
    } catch (e) {
      // If localStorage fails, allow submission but log error
      console.error('Rate limit check failed:', e);
      return { allowed: true };
    }
  };

  // Record submission timestamp
  const recordSubmission = () => {
    const now = Date.now();
    const storageKey = 'contact_form_submissions';
    
    try {
      const stored = localStorage.getItem(storageKey);
      const submissions = stored ? JSON.parse(stored) : [];
      
      // Add current submission
      submissions.push(now);
      
      // Keep only recent submissions (within the last 24 hours)
      const recentSubmissions = submissions.filter(
        timestamp => now - timestamp < 24 * 60 * 60 * 1000
      );
      
      localStorage.setItem(storageKey, JSON.stringify(recentSubmissions));
    } catch (e) {
      console.error('Failed to record submission:', e);
    }
  };

  // Validate honeypot
  const validateHoneypot = () => {
    const honeypotField = form.querySelector('#website');
    if (honeypotField && honeypotField.value.trim() !== '') {
      return {
        valid: false,
        message: 'Spam detected. Submission blocked.'
      };
    }
    return { valid: true };
  };

  // Optional: Add time-based validation (form must be visible for at least 3 seconds)
  let formVisibleTime = null;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !formVisibleTime) {
        formVisibleTime = Date.now();
      }
    });
  }, { threshold: 0.5 });

  const formContainer = form.closest('.contact-form');
  if (formContainer) {
    observer.observe(formContainer);
  }

  // Handle form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    removeMessages();

    // Time-based validation (form must be visible for at least 3 seconds)
    if (formVisibleTime) {
      const timeVisible = Date.now() - formVisibleTime;
      const minTimeVisible = 3000; // 3 seconds
      
      if (timeVisible < minTimeVisible) {
        const message = createMessage(
          'Please take your time filling out the form.',
          'error'
        );
        form.insertBefore(message, form.firstChild);
        return;
      }
    }

    // Validate honeypot
    const honeypotCheck = validateHoneypot();
    if (!honeypotCheck.valid) {
      const message = createMessage(honeypotCheck.message, 'error');
      form.insertBefore(message, form.firstChild);
      return;
    }

    // Check rate limiting
    const rateLimitCheck = checkRateLimit();
    if (!rateLimitCheck.allowed) {
      const message = createMessage(rateLimitCheck.message, 'error');
      form.insertBefore(message, form.firstChild);
      return;
    }

    // Get form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Remove honeypot field from data
    delete data.website;

    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';

    // Simulate form submission (replace with actual endpoint)
    // For now, we'll just show success and record the submission
    setTimeout(() => {
      // Record submission for rate limiting
      recordSubmission();

      // Show success message
      const successMessage = createMessage(
        'Thank you! Your message has been received. We\'ll get back to you soon.',
        'success'
      );
      form.insertBefore(successMessage, form.firstChild);

      // Reset form
      form.reset();

      // Reset button
      submitButton.disabled = false;
      submitButton.textContent = originalText;

      // Scroll to top of form
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Log form data (in production, send to server)
      console.log('Form submission:', data);
      
      // TODO: Replace with actual form submission endpoint
      // Example: fetch('/api/contact', { method: 'POST', body: JSON.stringify(data) })
    }, 500);
  });
})();

