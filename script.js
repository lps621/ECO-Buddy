// Global variables
        let currentMode = 'student';
        let currentFeature = 'chat';
        let messages = [];
        let isTyping = false;
        let greenPoints = 1250;
        let ecoScore = 750;

        // Cohere API configuration
        const COHERE_API_KEY = 'o8yAZr3EJx8lfBQ51XmvxX3i75mZxH0HkUNSzyUc'; // YOUR COHERE API KEY
        const COHERE_API_URL = 'https://api.cohere.ai/v1/chat';

        // Mode configurations
        const modes = {
            student: {
                name: 'Student Mode',
                description: 'Interactive learning & fun projects',
                systemPrompt: `You are EcoBuddy, a friendly environmental AI assistant designed for students. You should:
                - Use enthusiastic, encouraging language with emojis
                - Explain concepts in simple, age-appropriate terms
                - Focus on fun, hands-on activities and experiments
                - Make learning about the environment exciting and engaging
                - Provide practical tips students can implement at home or school
                - Always be positive and motivating about environmental action`,
                greeting: "🌱 Hey there, young eco-warrior! I'm EcoBuddy, your fun environmental friend! Ready to save the planet together!"
            },
            teacher: {
                name: 'Teacher Mode',
                description: 'Classroom resources & lesson plans',
                systemPrompt: `You are EcoBuddy, an environmental AI assistant designed for teachers. You should:
                - Provide structured, curriculum-aligned content
                - Offer lesson plans, activities, and assessment ideas
                - Include learning objectives and educational standards
                - Suggest classroom management strategies for environmental activities
                - Provide resources for different grade levels
                - Be professional yet approachable`,
                greeting: "Hello! I'm EcoBuddy, your environmental education assistant. I'm here to help you create engaging lessons and guide your students toward sustainability."
            },
            general: {
                name: 'General Mode',
                description: 'Practical eco-living advice',
                systemPrompt: `You are EcoBuddy, an environmental AI assistant for general audiences. You should:
                - Provide practical, actionable advice for sustainable living
                - Offer cost-effective solutions for environmental challenges
                - Include specific tips for home, work, and community
                - Be informative yet accessible to all knowledge levels
                - Focus on realistic steps people can take in their daily lives
                - Provide evidence-based environmental information`,
                greeting: "Welcome! I'm EcoBuddy, your practical environmental advisor. I'll help you make sustainable choices in your daily life."
            }
        };

        // Cohere API call function
        async function callCohereAPI(userMessage, mode) {
            const modeConfig = modes[mode];
            
            // Prepare chat history for Cohere API
            const chatHistory = messages.map(msg => ({
                role: msg.sender === 'user' ? 'USER' : 'CHATBOT',
                message: msg.text
            }));

            // Add the system prompt as a "PREAMBLE" for Cohere
            const preamble = modeConfig.systemPrompt;

            try {
                const response = await fetch(COHERE_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${COHERE_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: 'command-r-plus', // You can choose other Cohere models like 'command-r' or 'command'
                        message: userMessage,
                        chat_history: chatHistory,
                        preamble: preamble, // Use preamble for system prompt
                        temperature: 0.7,
                        max_tokens: 500
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                return data.text || data.message || 'Sorry, I encountered an error. Please try again.';
            } catch (error) {
                console.error('Cohere API error:', error);
                return 'Sorry, I\'m having trouble connecting right now. Please try again later.';
            }
        }

        // Initialize the app
        document.addEventListener('DOMContentLoaded', function() {
            initializeApp();
        });

        function initializeApp() {
            setupModeButtons();
            setupFeatureButtons();
            setupChatInput();
            setupVoiceInput();
            setupFileInput();
            
            // Show initial greeting
            showInitialGreeting();
        }

        function setupModeButtons() {
            const modeButtons = document.querySelectorAll('.mode-btn');
            modeButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const mode = this.dataset.mode;
                    if (mode !== currentMode) {
                        switchMode(mode);
                    }
                });
            });
        }

        function setupFeatureButtons() {
            const featureButtons = document.querySelectorAll('.feature-btn');
            featureButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const feature = this.dataset.feature;
                    if (feature !== currentFeature) {
                        switchFeature(feature);
                    }
                });
            });
        }

        function setupChatInput() {
            const messageInput = document.getElementById('message-input');
            const sendButton = document.getElementById('send-btn');

            messageInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });

            sendButton.addEventListener('click', sendMessage);
        }

        function setupVoiceInput() {
            const voiceButton = document.getElementById('voice-btn');
            
            if ('speechRecognition' in window || 'webkitSpeechRecognition' in window) {
                const SpeechRecognition = window.speechRecognition || window.webkitSpeechRecognition;
                const recognition = new SpeechRecognition();
                
                recognition.continuous = false;
                recognition.interimResults = false;
                recognition.lang = 'en-US';

                voiceButton.addEventListener('click', function() {
                    recognition.start();
                    voiceButton.innerHTML = '🔴';
                    voiceButton.style.animation = 'pulse 1s infinite';
                });

                recognition.onresult = function(event) {
                    const speechText = event.results[0][0].transcript;
                    document.getElementById('message-input').value = speechText;
                    voiceButton.innerHTML = '🎤';
                    voiceButton.style.animation = 'none';
                };

                recognition.onerror = function() {
                    voiceButton.innerHTML = '🎤';
                    voiceButton.style.animation = 'none';
                };
            } else {
                voiceButton.style.display = 'none';
            }
        }

        function setupFileInput() {
            const fileInput = document.getElementById('file-input');
            fileInput.addEventListener('change', function(event) {
                const file = event.target.files[0];
                if (file) {
                    processWasteImage(file);
                }
            });
        }

        function switchMode(mode) {
            currentMode = mode;
            
            // Update mode buttons
            document.querySelectorAll('.mode-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
            
            // Update chat header
            const modeConfig = modes[mode];
            document.getElementById('chat-mode-title').textContent = `EcoBuddy - ${modeConfig.name}`;
            document.getElementById('chat-mode-description').textContent = modeConfig.description;
            
            // Clear chat and show new greeting
            messages = [];
            document.getElementById('chat-messages').innerHTML = '';
            showInitialGreeting();
        }

        function switchFeature(feature) {
            currentFeature = feature;
            
            // Update feature buttons
            document.querySelectorAll('.feature-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector(`[data-feature="${feature}"]`).classList.add('active');
            
            // Update feature content
            document.querySelectorAll('.feature-content').forEach(content => {
                content.classList.remove('active');
            });
            document.querySelector(`.feature-content.${feature}`).classList.add('active');
        }

        function showInitialGreeting() {
            const greeting = modes[currentMode].greeting;
            addMessage('ai', greeting);
        }

        async function sendMessage() {
            const messageInput = document.getElementById('message-input');
            const message = messageInput.value.trim();
            
            if (!message || isTyping) return;
            
            // Add user message
            addMessage('user', message);
            messageInput.value = '';
            
            // Show typing indicator
            showTypingIndicator();
            
            try {
                // Get AI response
                const response = await callCohereAPI(message, currentMode);
                
                // Remove typing indicator and add AI response
                hideTypingIndicator();
                addMessage('ai', response);
                
                // Update points (simple simulation)
                updatePoints(10);
                
            } catch (error) {
                hideTypingIndicator();
                addMessage('ai', 'Sorry, I encountered an error. Please try again.');
            }
        }

        function addMessage(sender, text) {
            const messagesContainer = document.getElementById('chat-messages');
            const messageElement = document.createElement('div');
            messageElement.className = `message ${sender}`;
            
            const bubble = document.createElement('div');
            bubble.className = 'message-bubble';
            bubble.textContent = text;
            
            messageElement.appendChild(bubble);
            messagesContainer.appendChild(messageElement);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
            // Store message
            messages.push({ sender, text });
        }

        function showTypingIndicator() {
            isTyping = true;
            const messagesContainer = document.getElementById('chat-messages');
            const typingElement = document.createElement('div');
            typingElement.className = 'message ai';
            typingElement.id = 'typing-indicator';
            
            const typingBubble = document.createElement('div');
            typingBubble.className = 'typing-indicator';
            typingBubble.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
            
            typingElement.appendChild(typingBubble);
            messagesContainer.appendChild(typingElement);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function hideTypingIndicator() {
            isTyping = false;
            const typingElement = document.getElementById('typing-indicator');
            if (typingElement) {
                typingElement.remove();
            }
        }

        function updatePoints(points) {
            greenPoints += points;
            document.getElementById('green-points').textContent = greenPoints.toLocaleString();
            
            // Simple eco score calculation
            ecoScore = Math.floor(greenPoints * 0.6);
            document.getElementById('eco-score').textContent = ecoScore.toLocaleString();
        }

        function processWasteImage(file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const resultDiv = document.getElementById('scan-result');
                const contentDiv = document.getElementById('result-content');
                
                // Simple simulation of waste classification
                const wasteTypes = [
                    { type: 'Plastic Bottle', category: 'Recyclable', color: '#4CAF50', disposal: 'Place in recycling bin' },
                    { type: 'Organic Waste', category: 'Compostable', color: '#8BC34A', disposal: 'Add to compost bin' },
                    { type: 'Paper', category: 'Recyclable', color: '#2196F3', disposal: 'Place in paper recycling' },
                    { type: 'E-waste', category: 'Special Disposal', color: '#FF9800', disposal: 'Take to e-waste center' }
                ];
                
                const randomWaste = wasteTypes[Math.floor(Math.random() * wasteTypes.length)];
                
                contentDiv.innerHTML = `
                    <div style="background: white; padding: 20px; border-radius: 10px; text-align: center;">
                        <h4 style="color: ${randomWaste.color}; margin-bottom: 10px;">${randomWaste.type}</h4>
                        <p><strong>Category:</strong> ${randomWaste.category}</p>
                        <p><strong>Disposal:</strong> ${randomWaste.disposal}</p>
                        <div style="margin-top: 15px;">
                            <button onclick="updatePoints(25)" style="background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                                ✓ Properly Disposed (+25 points)
                            </button>
                        </div>
                    </div>
                `;
                
                resultDiv.style.display = 'block';
                updatePoints(5); // Points for scanning
            };
            reader.readAsDataURL(file);
        }

        // Simulate real-time updates
        setInterval(function() {
            // Randomly update some stats
            if (Math.random() < 0.1) { // 10% chance every interval
                updatePoints(Math.floor(Math.random() * 5) + 1);
            }
        }, 10000); // Every 10 seconds

        // Handle mobile responsiveness
        window.addEventListener('resize', function() {
            const chatMessages = document.getElementById('chat-messages');
            if (chatMessages) {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        });
