 <script>
        // Algebra Course Engine
        class AlgebraEngine {
            constructor() {
                this.modes = {
                    beginner: {
                        name: 'Beginner',
                        description: 'One-step equations',
                        requiredScore: 0,
                        problemsToUnlock: 10
                    },
                    intermediate: {
                        name: 'Intermediate',
                        description: 'Two-step equations',
                        requiredScore: 100,
                        problemsToUnlock: 10
                    },
                    advanced: {
                        name: 'Advanced',
                        description: 'Complex equations',
                        requiredScore: 250,
                        problemsToUnlock: 10
                    }
                };
                
                this.currentMode = 'beginner';
                this.score = 0;
                this.streak = 0;
                this.level = 1;
                this.problemsSolved = 0;
                this.currentProblem = null;
                this.history = [];
                this.selectedOperation = null;
                this.selectedNumber = null;
                
                this.init();
            }
            
            init() {
                this.loadProgress();
                this.attachEventListeners();
                this.updateUI();
            }
            
            // Equation Parser and Manipulator
            parseEquation(equationStr) {
                const [left, right] = equationStr.split('=').map(s => s.trim());
                return { left: this.parseExpression(left), right: this.parseExpression(right) };
            }
            
            parseExpression(expr) {
                expr = expr.replace(/\s+/g, '');
                const terms = [];
                let currentTerm = '';
                let sign = '+';
                
                for (let i = 0; i < expr.length; i++) {
                    const char = expr[i];
                    if (char === '+' || char === '-') {
                        if (currentTerm) {
                            terms.push({ coefficient: this.parseCoefficient(currentTerm, sign), variable: currentTerm.includes('x') });
                            currentTerm = '';
                        }
                        sign = char;
                    } else {
                        currentTerm += char;
                    }
                }
                
                if (currentTerm) {
                    terms.push({ coefficient: this.parseCoefficient(currentTerm, sign), variable: currentTerm.includes('x') });
                }
                
                return terms;
            }
            
            parseCoefficient(term, sign) {
                let coeff = term.replace('x', '');
                if (coeff === '' || coeff === '+') coeff = '1';
                if (coeff === '-') coeff = '-1';
                const value = parseFloat(coeff);
                return sign === '-' ? -value : value;
            }
            
            expressionToString(terms) {
                if (terms.length === 0) return '0';
                
                let result = '';
                terms.forEach((term, index) => {
                    if (term.coefficient === 0) return;
                    
                    const absCoeff = Math.abs(term.coefficient);
                    const sign = term.coefficient < 0 ? '-' : (index > 0 ? '+' : '');
                    
                    if (term.variable) {
                        if (absCoeff === 1) {
                            result += `${sign}${index > 0 ? ' ' : ''}x`;
                        } else {
                            result += `${sign}${index > 0 ? ' ' : ''}${absCoeff}x`;
                        }
                    } else {
                        result += `${sign}${index > 0 ? ' ' : ''}${absCoeff}`;
                    }
                });
                
                return result || '0';
            }
            
            applyOperation(equation, operation, value) {
                const newEquation = {
                    left: [...equation.left],
                    right: [...equation.right]
                };
                
                switch(operation) {
                    case 'add':
                        newEquation.left.push({ coefficient: value, variable: false });
                        newEquation.right.push({ coefficient: value, variable: false });
                        break;
                    case 'subtract':
                        newEquation.left.push({ coefficient: -value, variable: false });
                        newEquation.right.push({ coefficient: -value, variable: false });
                        break;
                    case 'multiply':
                        newEquation.left = newEquation.left.map(term => ({
                            coefficient: term.coefficient * value,
                            variable: term.variable
                        }));
                        newEquation.right = newEquation.right.map(term => ({
                            coefficient: term.coefficient * value,
                            variable: term.variable
                        }));
                        break;
                    case 'divide':
                        if (value === 0) throw new Error("Cannot divide by zero!");
                        newEquation.left = newEquation.left.map(term => ({
                            coefficient: term.coefficient / value,
                            variable: term.variable
                        }));
                        newEquation.right = newEquation.right.map(term => ({
                            coefficient: term.coefficient / value,
                            variable: term.variable
                        }));
                        break;
                }
                
                // Simplify by combining like terms
                newEquation.left = this.simplifyTerms(newEquation.left);
                newEquation.right = this.simplifyTerms(newEquation.right);
                
                return newEquation;
            }
            
            simplifyTerms(terms) {
                let xCoeff = 0;
                let constant = 0;
                
                terms.forEach(term => {
                    if (term.variable) {
                        xCoeff += term.coefficient;
                    } else {
                        constant += term.coefficient;
                    }
                });
                
                const simplified = [];
                if (xCoeff !== 0) {
                    simplified.push({ coefficient: xCoeff, variable: true });
                }
                if (constant !== 0) {
                    simplified.push({ coefficient: constant, variable: false });
                }
                
                return simplified.length > 0 ? simplified : [{ coefficient: 0, variable: false }];
            }
            
            isSolved(equation) {
                // Check if left side is just 'x' or a coefficient of x
                const leftHasOnlyX = equation.left.length === 1 && equation.left[0].variable;
                const rightHasNoX = !equation.right.some(term => term.variable);
                return leftHasOnlyX && rightHasNoX && equation.left[0].coefficient === 1;
            }
            
            getSolution(equation) {
                if (!this.isSolved(equation)) return null;
                return equation.right.reduce((sum, term) => sum + term.coefficient, 0);
            }
            
            // Problem Generation
            generateProblem(mode) {
                let equation;
                
                switch(mode) {
                    case 'beginner':
                        equation = this.generateBeginnerProblem();
                        break;
                    case 'intermediate':
                        equation = this.generateIntermediateProblem();
                        break;
                    case 'advanced':
                        equation = this.generateAdvancedProblem();
                        break;
                    default:
                        equation = this.generateBeginnerProblem();
                }
                
                return equation;
            }
            
            generateBeginnerProblem() {
                const type = Math.floor(Math.random() * 3);
                let left, right;
                
                switch(type) {
                    case 0: // x + a = b
                        const a = Math.floor(Math.random() * 10) + 1;
                        const b = Math.floor(Math.random() * 10) + a + 1;
                        left = [{ coefficient: 1, variable: true }, { coefficient: a, variable: false }];
                        right = [{ coefficient: b, variable: false }];
                        break;
                    case 1: // x - a = b
                        const a2 = Math.floor(Math.random() * 10) + 1;
                        const b2 = Math.floor(Math.random() * 15) + 1;
                        left = [{ coefficient: 1, variable: true }, { coefficient: -a2, variable: false }];
                        right = [{ coefficient: b2, variable: false }];
                        break;
                    case 2: // ax = b
                        const coeff = Math.floor(Math.random() * 5) + 2;
                        const result = coeff * (Math.floor(Math.random() * 10) + 1);
                        left = [{ coefficient: coeff, variable: true }];
                        right = [{ coefficient: result, variable: false }];
                        break;
                }
                
                return { left, right };
            }
            
            generateIntermediateProblem() {
                const coeff = Math.floor(Math.random() * 5) + 2;
                const constant = Math.floor(Math.random() * 10) + 1;
                const solution = Math.floor(Math.random() * 10) + 1;
                const result = coeff * solution + constant;
                
                const useSubtraction = Math.random() > 0.5;
                
                return {
                    left: [
                        { coefficient: coeff, variable: true },
                        { coefficient: useSubtraction ? -constant : constant, variable: false }
                    ],
                    right: [{ coefficient: useSubtraction ? result - 2*constant : result, variable: false }]
                };
            }
            
            generateAdvancedProblem() {
                // Generate equations like ax + b = cx + d
                const a = Math.floor(Math.random() * 5) + 3;
                const b = Math.floor(Math.random() * 10) + 1;
                const c = Math.floor(Math.random() * 3) + 1;
                const solution = Math.floor(Math.random() * 10) + 1;
                const d = a * solution + b - c * solution;
                
                return {
                    left: [
                        { coefficient: a, variable: true },
                        { coefficient: b, variable: false }
                    ],
                    right: [
                        { coefficient: c, variable: true },
                        { coefficient: d, variable: false }
                    ]
                };
            }
            
            // Hint System
            getHint() {
                if (!this.currentProblem) return "Start by selecting an operation and a number.";
                
                const equation = this.currentProblem;
                
                // Check if solved
                if (this.isSolved(equation)) {
                    return "Great job! The equation is solved! Click 'Next Problem' to continue.";
                }
                
                // Analyze what operation would be helpful
                const leftTerms = equation.left;
                const rightTerms = equation.right;
                
                // If there are constants on the left with x
                const leftConstant = leftTerms.find(t => !t.variable);
                if (leftConstant) {
                    if (leftConstant.coefficient > 0) {
                        return `Try subtracting ${Math.abs(leftConstant.coefficient)} from both sides to isolate the x term.`;
                    } else {
                        return `Try adding ${Math.abs(leftConstant.coefficient)} to both sides to isolate the x term.`;
                    }
                }
                
                // If there's an x term on the right
                const rightXTerm = rightTerms.find(t => t.variable);
                if (rightXTerm) {
                    return `Try subtracting ${Math.abs(rightXTerm.coefficient)}x from both sides to get all x terms on the left.`;
                }
                
                // If x has a coefficient other than 1
                const xTerm = leftTerms.find(t => t.variable);
                if (xTerm && xTerm.coefficient !== 1) {
                    if (Number.isInteger(xTerm.coefficient)) {
                        return `The coefficient of x is ${xTerm.coefficient}. Try dividing both sides by ${Math.abs(xTerm.coefficient)}.`;
                    } else {
                        return `Try to simplify the coefficient of x by dividing both sides.`;
                    }
                }
                
                return "Think about what operation would help isolate x on one side.";
            }
            
            // UI Updates
            updateUI() {
                // Update scores
                document.getElementById('score').textContent = this.score;
                document.getElementById('streak').textContent = this.streak;
                document.getElementById('level').textContent = this.level;
                document.getElementById('progress').textContent = `${this.problemsSolved % 10}/10`;
                
                // Update mode buttons
                this.updateModeButtons();
                
                // Update equation display
                if (this.currentProblem) {
                    const equationStr = `${this.expressionToString(this.currentProblem.left)} = ${this.expressionToString(this.currentProblem.right)}`;
                    document.getElementById('equationDisplay').textContent = equationStr;
                }
                
                // Update apply button state
                const applyBtn = document.getElementById('applyBtn');
                if (this.selectedOperation && this.selectedNumber !== null) {
                    applyBtn.disabled = false;
                } else {
                    applyBtn.disabled = true;
                }
            }
            
            updateModeButtons() {
                const modes = ['beginner', 'intermediate', 'advanced'];
                modes.forEach(mode => {
                    const btn = document.getElementById(`${mode}Btn`);
                    if (this.score >= this.modes[mode].requiredScore) {
                        btn.classList.remove('locked');
                    } else {
                        btn.classList.add('locked');
                    }
                    
                    if (mode === this.currentMode) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
            }
            
            // History Management
            addToHistory(equation, operation = null) {
                const historyItem = {
                    equation: `${this.expressionToString(equation.left)} = ${this.expressionToString(equation.right)}`,
                    operation: operation,
                    step: this.history.length + 1
                };
                
                this.history.push(historyItem);
                this.renderHistory();
            }
            
            renderHistory() {
                const historyList = document.getElementById('historyList');
                historyList.innerHTML = '';
                
                this.history.forEach((item, index) => {
                    const div = document.createElement('div');
                    div.className = 'history-item';
                    div.innerHTML = `
                        <div class="history-step-number">Step ${item.step}</div>
                        <div class="history-equation">${item.equation}</div>
                        ${item.operation ? `<div class="history-operation">${item.operation}</div>` : ''}
                    `;
                    historyList.appendChild(div);
                });
            }
            
            clearHistory() {
                this.history = [];
                if (this.currentProblem) {
                    this.addToHistory(this.currentProblem, 'Starting equation');
                }
                this.renderHistory();
            }
            
            // Message System
            showMessage(text, type = 'info', duration = 3000) {
                const container = document.getElementById('messageContainer');
                const message = document.createElement('div');
                message.className = `message ${type}`;
                
                const icons = {
                    success: '✅',
                    error: '❌',
                    hint: '💡',
                    info: 'ℹ️'
                };
                
                message.innerHTML = `
                    <span class="message-icon">${icons[type]}</span>
                    <span class="message-text">${text}</span>
                `;
                
                container.appendChild(message);
                
                setTimeout(() => {
                    message.style.animation = 'slideInRight 0.3s ease reverse';
                    setTimeout(() => message.remove(), 300);
                }, duration);
            }
            
            // Problem Flow
            startNewProblem() {
                this.currentProblem = this.generateProblem(this.currentMode);
                this.history = [];
                this.selectedOperation = null;
                this.selectedNumber = null;
                
                // Clear selections
                document.querySelectorAll('.op-btn, .num-btn').forEach(btn => {
                    btn.classList.remove('selected');
                });
                
                this.addToHistory(this.currentProblem, 'Starting equation');
                this.updateUI();
            }
            
            applyOperationToEquation() {
                if (!this.selectedOperation || this.selectedNumber === null) {
                    this.showMessage('Please select both an operation and a number!', 'error');
                    return;
                }
                
                try {
                    const operationText = this.getOperationText(this.selectedOperation, this.selectedNumber);
                    this.currentProblem = this.applyOperation(
                        this.currentProblem,
                        this.selectedOperation,
                        this.selectedNumber
                    );
                    
                    this.addToHistory(this.currentProblem, operationText);
                    
                    // Reset selections
                    this.selectedOperation = null;
                    this.selectedNumber = null;
                    document.querySelectorAll('.op-btn, .num-btn').forEach(btn => {
                        btn.classList.remove('selected');
                    });
                    
                    this.updateUI();
                    
                    // Check if solved
                    if (this.isSolved(this.currentProblem)) {
                        this.onProblemSolved();
                    }
                    
                } catch (error) {
                    this.showMessage(error.message, 'error');
                }
            }
            
            getOperationText(operation, value) {
                switch(operation) {
                    case 'add': return `Add ${value} to both sides`;
                    case 'subtract': return `Subtract ${value} from both sides`;
                    case 'multiply': return `Multiply both sides by ${value}`;
                    case 'divide': return `Divide both sides by ${value}`;
                    default: return '';
                }
            }
            
            onProblemSolved() {
                const solution = this.getSolution(this.currentProblem);
                const points = this.currentMode === 'beginner' ? 10 :
                              this.currentMode === 'intermediate' ? 20 : 30;
                
                this.score += points;
                this.streak++;
                this.problemsSolved++;
                
                if (this.problemsSolved % 10 === 0) {
                    this.level++;
                }
                
                this.saveProgress();
                this.updateUI();
                
                // Show success modal
                document.getElementById('modalSolution').textContent = `x = ${solution}`;
                document.getElementById('successModal').classList.add('active');
                
                this.showMessage(`Correct! +${points} points`, 'success', 5000);
            }
            
            // Event Listeners
            attachEventListeners() {
                // Operation buttons
                document.querySelectorAll('.op-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        if (btn.disabled) return;
                        
                        document.querySelectorAll('.op-btn').forEach(b => b.classList.remove('selected'));
                        btn.classList.add('selected');
                        this.selectedOperation = btn.dataset.op;
                        this.updateUI();
                    });
                });
                
                // Number buttons
                document.querySelectorAll('.num-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        if (btn.disabled) return;
                        
                        document.querySelectorAll('.num-btn').forEach(b => b.classList.remove('selected'));
                        btn.classList.add('selected');
                        this.selectedNumber = parseInt(btn.dataset.num);
                        this.updateUI();
                    });
                });
                
                // Apply button
                document.getElementById('applyBtn').addEventListener('click', () => {
                    this.applyOperationToEquation();
                });
                
                // Hint button
                document.getElementById('hintBtn').addEventListener('click', () => {
                    const hint = this.getHint();
                    this.showMessage(hint, 'hint', 5000);
                });
                
                // Mode buttons
                document.querySelectorAll('.mode-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const mode = btn.dataset.mode;
                        if (this.score < this.modes[mode].requiredScore) {
                            this.showMessage(`Unlock ${this.modes[mode].name} mode by reaching ${this.modes[mode].requiredScore} points!`, 'info');
                            return;
                        }
                        
                        this.currentMode = mode;
                        this.updateUI();
                        this.showLesson(mode);
                    });
                });
                
                // Keyboard support
                document.addEventListener('keydown', (e) => {
                    if (e.key >= '0' && e.key <= '9') {
                        const num = parseInt(e.key);
                        const btn = document.querySelector(`.num-btn[data-num="${num}"]`);
                        if (btn && !btn.disabled) {
                            btn.click();
                        }
                    } else if (e.key === 'Enter' && !document.getElementById('applyBtn').disabled) {
                        this.applyOperationToEquation();
                    } else if (e.key === 'h' || e.key === 'H') {
                        document.getElementById('hintBtn').click();
                    }
                });
            }
            
            // Lesson System
            showLesson(mode) {
                const lessonPanel = document.getElementById('lessonPanel');
                const practiceArea = document.getElementById('practiceArea');
                
                lessonPanel.classList.add('active');
                practiceArea.style.display = 'none';
                
                const lessons = {
                    beginner: {
                        title: 'Beginner: One-Step Equations',
                        content: `
                            <p>Welcome to one-step equations! These are the foundation of algebra.</p>
                            <div class="lesson-example">
                                <p><strong>Example 1: Solve x + 4 = 9</strong></p>
                                <div class="lesson-step">x + 4 = 9</div>
                                <div class="lesson-explanation">We need to isolate x. Since 4 is being added to x, we'll subtract 4 from both sides.</div>
                                <div class="lesson-step">x + 4 - 4 = 9 - 4</div>
                                <div class="lesson-explanation">The +4 and -4 cancel out on the left side.</div>
                                <div class="lesson-step">x = 5</div>
                                <div class="lesson-explanation">Perfect! x equals 5.</div>
                            </div>
                            <div class="lesson-example">
                                <p><strong>Example 2: Solve 3x = 12</strong></p>
                                <div class="lesson-step">3x = 12</div>
                                <div class="lesson-explanation">x is being multiplied by 3. To isolate x, divide both sides by 3.</div>
                                <div class="lesson-step">3x ÷ 3 = 12 ÷ 3</div>
                                <div class="lesson-explanation">The 3s cancel out on the left.</div>
                                <div class="lesson-step">x = 4</div>
                                <div class="lesson-explanation">Excellent! x equals 4.</div>
                            </div>
                            <p><strong>Key Rule:</strong> Whatever you do to one side, you must do to the other!</p>
                        `
                    },
                    intermediate: {
                        title: 'Intermediate: Two-Step Equations',
                        content: `
                            <p>Two-step equations require two operations to solve. Let's master them!</p>
                            <div class="lesson-example">
                                <p><strong>Example: Solve 2x + 6 = 14</strong></p>
                                <div class="lesson-step">2x + 6 = 14</div>
                                <div class="lesson-explanation">Step 1: Remove the constant term (+6) by subtracting 6 from both sides.</div>
                                <div class="lesson-step">2x + 6 - 6 = 14 - 6</div>
                                <div class="lesson-step">2x = 8</div>
                                <div class="lesson-explanation">Step 2: Now divide both sides by 2 to isolate x.</div>
                                <div class="lesson-step">2x ÷ 2 = 8 ÷ 2</div>
                                <div class="lesson-step">x = 4</div>
                                <div class="lesson-explanation">Success! We found x = 4.</div>
                            </div>
                            <p><strong>Strategy:</strong> First eliminate constants, then deal with coefficients.</p>
                        `
                    },
                    advanced: {
                        title: 'Advanced: Complex Equations',
                        content: `
                            <p>Advanced equations have variables on both sides. Let's conquer them!</p>
                            <div class="lesson-example">
                                <p><strong>Example: Solve 5x + 3 = 2x + 12</strong></p>
                                <div class="lesson-step">5x + 3 = 2x + 12</div>
                                <div class="lesson-explanation">Step 1: Move all x terms to one side. Subtract 2x from both sides.</div>
                                <div class="lesson-step">5x - 2x + 3 = 2x - 2x + 12</div>
                                <div class="lesson-step">3x + 3 = 12</div>
                                <div class="lesson-explanation">Step 2: Subtract 3 from both sides.</div>
                                <div class="lesson-step">3x + 3 - 3 = 12 - 3</div>
                                <div class="lesson-step">3x = 9</div>
                                <div class="lesson-explanation">Step 3: Divide both sides by 3.</div>
                                <div class="lesson-step">3x ÷ 3 = 9 ÷ 3</div>
                                <div class="lesson-step">x = 3</div>
                                <div class="lesson-explanation">Brilliant! x = 3 is our solution.</div>
                            </div>
                            <p><strong>Strategy:</strong> Collect like terms, then solve step by step.</p>
                        `
                    }
                };
                
                document.getElementById('lessonContent').innerHTML = lessons[mode].content + 
                    '<button class="start-practice-btn" onclick="startPractice()">Start Practice</button>';
                document.querySelector('.lesson-title').textContent = lessons[mode].title;
            }
            
            // Progress Management
            saveProgress() {
                const progress = {
                    score: this.score,
                    streak: this.streak,
                    level: this.level,
                    problemsSolved: this.problemsSolved,
                    currentMode: this.currentMode
                };
                localStorage.setItem('algebraProgress', JSON.stringify(progress));
            }
            
            loadProgress() {
                const saved = localStorage.getItem('algebraProgress');
                if (saved) {
                    const progress = JSON.parse(saved);
                    this.score = progress.score || 0;
                    this.streak = progress.streak || 0;
                    this.level = progress.level || 1;
                    this.problemsSolved = progress.problemsSolved || 0;
                    this.currentMode = progress.currentMode || 'beginner';
                }
            }
        }
        
        // Global Functions
        let engine;
        
        function startPractice() {
            document.getElementById('lessonPanel').classList.remove('active');
            document.getElementById('practiceArea').style.display = 'grid';
            if (engine) {
                engine.startNewProblem();
            }
        }
        
        function nextProblem() {
            document.getElementById('successModal').classList.remove('active');
            if (engine) {
                engine.startNewProblem();
            }
        }
        
        function reviewSteps() {
            document.getElementById('successModal').classList.remove('active');
        }
        
        function clearHistory() {
            if (engine) {
                engine.clearHistory();
            }
        }
        
        // Initialize on page load
        document.addEventListener('DOMContentLoaded', () => {
            engine = new AlgebraEngine();
            // Show the beginner lesson by default
            engine.showLesson('beginner');
        });
    </script>
