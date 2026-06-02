
self.addEventListener('push', e => {
    const data = e.data.json();
    console.log('Push Received...', data);
    
    self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || '/icon.png',
        vibrate: [200, 100, 200, 100, 200, 100, 200], // vibration pattern
        data: { url: '/' } // Store URL to open later
    });
});

self.addEventListener('notificationclick', e => {
    e.notification.close(); // Close the notification
    
    e.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // Check if app is already open and focus it
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not open, open a new window
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
