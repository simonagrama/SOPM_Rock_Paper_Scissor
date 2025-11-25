import React, { Component } from "react";
import './Game.css';
import './DarkMode.css';

// Importă imaginile (VERIFICĂ CALEA: '../assets/...')
import rockImg from '../assets/rock.png';
import paperImg from '../assets/paper.png';
import scissorsImg from '../assets/scissors.png';
import lizardImg from '../assets/lizard.png'; 
import spockImg from '../assets/spock.png'; 

// Importă sunete (VERIFICĂ CALEA!)
import winSound from '../assets/win.mp3';
import loseSound from '../assets/lose.mp3';
import clickSound from '../assets/click.mp3';

// --- CONSTANTE GLOBALE ---
const MAX_SCORE = 5; 
const TIME_LIMIT = 5;
const ALL_CHOICES = ['ROCK', 'PAPER', 'SCISSORS', 'LIZARD', 'SPOCK'];

// MAPPING PENTRU LOGICĂ ȘI VIZUAL
const choiceMap = {
    ROCK: { name: 'Piatră', image: rockImg, color: '#ff6347' },
    PAPER: { name: 'Hârtie', image: paperImg, color: '#4682b4' },
    SCISSORS: { name: 'Foarfecă', image: scissorsImg, color: '#3cb371' },
    LIZARD: { name: 'Șopârlă', image: lizardImg, color: '#8a2be2' }, 
    SPOCK: { name: 'Spock', image: spockImg, color: '#ffd700' }, 
};

// REGULI COMPLEXE (Cine bate pe cine)
const beatsMap = {
ROCK: ['LIZARD', 'SCISSORS'], // Piatra bate Șopârla și Foarfeca
 PAPER: ['ROCK', 'SPOCK'], // Hârtia bate Piatra și Spock
 SCISSORS: ['PAPER', 'LIZARD'], // Foarfeca bate Hârtia și Șopârla
 LIZARD: ['SPOCK', 'PAPER'], // Șopârla bate Spock și Hârtia
 SPOCK: ['SCISSORS', 'ROCK'] // Spock bate Foarfeca și Piatra
};

class Game extends Component {
    constructor(props) {
        super(props)
        this.state = {
            playerVal: null,
            computerVal: null,
            playerScore: 0,
            compScore: 0,
            result: `Primul la ${MAX_SCORE} câștigă!`,
            isThinking: false, 
            gameOver: false,
            isDark: false, 
            timer: TIME_LIMIT,
            difficulty: 'EASY',
            lastPlayerChoice: null,
        };
        this.timerInterval = null;
        this.audioWin = new Audio(winSound);
        this.audioLose = new Audio(loseSound);
        this.audioClick = new Audio(clickSound);
    }

    componentDidMount() {
        this.startTimer();
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.gameOver !== this.state.gameOver && this.state.gameOver) {
            clearInterval(this.timerInterval);
        }
        if (prevState.isThinking && !this.state.isThinking && !this.state.gameOver) {
            this.startTimer();
        }
    }

    componentWillUnmount() {
        clearInterval(this.timerInterval);
    }

    startTimer = () => {
        clearInterval(this.timerInterval);
        this.setState({ timer: TIME_LIMIT });
        
        this.timerInterval = setInterval(() => {
            if (this.state.timer > 1) {
                this.setState(prevState => ({ timer: prevState.timer - 1 }));
            } else {
                clearInterval(this.timerInterval);
                this.handleTimeoutLoss();
            }
        }, 1000);
    }
    
    handleTimeoutLoss = () => {
        if (this.state.gameOver || this.state.playerVal !== null) return;
        
        this.setState({
            playerVal: 'TIMEOUT',
            isThinking: true,
            result: 'Timpul a expirat! Calculatorul câștigă runda.',
        });

        setTimeout(() => {
            const compChoice = this.getComputerChoice();
            
            let finalCompScore = this.state.compScore + 1;
            let isGameOver = finalCompScore === MAX_SCORE;
            
            this.setState({
                computerVal: compChoice,
                compScore: finalCompScore,
                result: isGameOver ? "JOC TERMINAT! Calculatorul a Câștigat." : 'Timpul a expirat! Calculatorul a Câștigat Runda.',
                isThinking: false,
                gameOver: isGameOver,
            });
        }, 500);
    }

    getComputerChoice = () => {
        const { difficulty, lastPlayerChoice } = this.state;
        
        if (difficulty === 'EASY' || !lastPlayerChoice) {
            const randomIndex = Math.floor(Math.random() * ALL_CHOICES.length);
            return ALL_CHOICES[randomIndex];
        }

        const chance = Math.random();
        
        if (chance < 0.3) { 
            // Modul Expert: 30% șansă de a alege o mutare care să bată ultima mutare a jucătorului
            const winningChoices = Object.keys(beatsMap).filter(key => beatsMap[key].includes(lastPlayerChoice));
            if (winningChoices.length > 0) {
                return winningChoices[Math.floor(Math.random() * winningChoices.length)];
            }
        }
        
        // 70% șansă: Alegere aleatorie obișnuită
        const randomIndex = Math.floor(Math.random() * ALL_CHOICES.length);
        return ALL_CHOICES[randomIndex];
    }

    logic = (playerVal, computerVal) => {
        if (playerVal === computerVal) return 0; 
        // Verifică dacă mutarea calculatorului BATE mutarea jucătorului (căutăm mutarea jucătorului în lista de pierzători a calculatorului)
        if (beatsMap[computerVal].includes(playerVal)) return -1; 
        
        return 1; // Jucătorul câștigă
    }

    decision = (playerChoice) => {
        if (this.state.gameOver || this.state.isThinking) return;

        this.audioClick.play();
        clearInterval(this.timerInterval);
        
        this.setState({ 
            isThinking: true, 
            playerVal: playerChoice, 
            computerVal: null, 
            result: 'Calculatorul gândește...' 
        });

        setTimeout(() => {
            const compChoice = this.getComputerChoice();
            const val = this.logic(playerChoice, compChoice);

            let newResult;
            let finalPlayerScore = this.state.playerScore;
            let finalCompScore = this.state.compScore;

            if (val === 1) {
                newResult = "Ai Câștigat Runda!";
                finalPlayerScore += 1;
                this.audioWin.play();
            } else if (val === -1) {
                newResult = "Calculatorul a Câștigat Runda.";
                finalCompScore += 1;
                this.audioLose.play();
            } else {
                newResult = "Egalitate!";
            }

            let isGameOver = false;
            if (finalPlayerScore === MAX_SCORE) {
                newResult = "JOC TERMINAT! AI CÂȘTIGAT MARELE PREMIU!";
                isGameOver = true;
            } else if (finalCompScore === MAX_SCORE) {
                newResult = "JOC TERMINAT! Calculatorul a Câștigat.";
                isGameOver = true;
            }

            this.setState({
                playerVal: playerChoice,
                computerVal: compChoice,
                playerScore: finalPlayerScore,
                compScore: finalCompScore,
                result: newResult,
                isThinking: false,
                gameOver: isGameOver,
                lastPlayerChoice: playerChoice,
            });
        }, 500); 
    }

    resetGame = () => {
        clearInterval(this.timerInterval);
        this.setState({
            playerVal: null,
            computerVal: null,
            playerScore: 0,
            compScore: 0,
            result: `Primul la ${MAX_SCORE} câștigă!`,
            isThinking: false,
            gameOver: false,
            timer: TIME_LIMIT,
        }, this.startTimer);
    }
    
    toggleDarkMode = () => {
        this.setState(prevState => {
            const newIsDark = !prevState.isDark;
            if (newIsDark) {
                document.body.classList.add('dark-mode-body');
            } else {
                document.body.classList.remove('dark-mode-body');
            }
            return { isDark: newIsDark };
        });
    }

    setDifficulty = (level) => {
        this.setState({ difficulty: level }, this.resetGame);
    }

    render() {
        const { playerVal, computerVal, playerScore, compScore, result, isThinking, gameOver, isDark, timer, difficulty } = this.state;
        
        const playerImage = playerVal && playerVal !== 'TIMEOUT' ? choiceMap[playerVal].image : null;
        const computerImage = computerVal ? choiceMap[computerVal]?.image : null;
        
        let resultClass = '';
        if (result.includes('MARELE PREMIU')) resultClass = 'winner-final';
        else if (result.includes('Câștigat Runda')) resultClass = 'winner-text';
        else if (result.includes('Calculatorul a Câștigat Runda')) resultClass = 'loser-text';
        else if (result.includes('Egalitate')) resultClass = 'draw-text';
        else if (result.includes('Timpul a expirat')) resultClass = 'loser-text';
        
        const containerClass = isDark ? 'game-container dark-mode' : 'game-container';

        return (
            <div className={containerClass}>
                
                {/* 1. BUTON DARK MODE (POZIȚIONARE DREAPTA SUS) */}
                <button onClick={this.toggleDarkMode} className="dark-mode-toggle">
                    {isDark ? '☀️ Mod Luminos' : '🌙 Mod Întunecat'}
                </button>
                
                <h1 className="game-title">Piatră, Hârtie, Foarfecă, Șopârlă, Spock</h1>
                
                {/* 2. SELECTOR DIFICULTATE (NOU) */}
                <div className="difficulty-settings">
                    <button 
                        onClick={() => this.setDifficulty('EASY')} 
                        className={`difficulty-button easy-button ${difficulty === 'EASY' ? 'active-difficulty' : ''}`}
                        disabled={isThinking || gameOver}
                    >Ușor</button>
                    <button 
                        onClick={() => this.setDifficulty('HARD')} 
                        className={`difficulty-button expert-button ${difficulty === 'HARD' ? 'active-difficulty' : ''}`}
                        disabled={isThinking || gameOver}
                    >Expert</button>
                </div>
                
                {/* Cronometru */}
                {!gameOver && !isThinking && (
                    <div className={`timer-display ${timer <= 2 ? 'warning' : ''}`}>
                        Timp Rămas: {timer} secunde
                    </div>
                )}
                
                {gameOver && (
                    <h2 className={`final-message ${resultClass}`}>{result}</h2>
                )}

                {/* Butoanele de alegere */}
                <div className="choices-buttons">
                    {Object.keys(choiceMap).map(choiceKey => (
                        <button 
                            key={choiceKey} 
                            onClick={() => this.decision(choiceKey)}
                            className="choice-button"
                            disabled={isThinking || gameOver}
                            style={{borderColor: choiceMap[choiceKey].color}} 
                        >
                            <img src={choiceMap[choiceKey].image} alt={choiceMap[choiceKey].name} className="choice-icon" />
                            <span>{choiceMap[choiceKey].name}</span>
                        </button>
                    ))}
                </div>

                {/* Secțiunea de rezultate */}
                <div className="results-section">
                    {(playerVal || isThinking) ? (
                        <div className="round-display">
                            {/* Afișarea Jucătorului */}
                            <div className="player-display">
                                <h3>Tu</h3>
                                {playerVal === 'TIMEOUT' 
                                    ? <p className="timeout-message">TIMP EXPIRAT</p>
                                    : playerImage && <img src={playerImage} alt={choiceMap[playerVal]?.name} className="result-image" />
                                }
                            </div>
                            
                            <div className="versus">
                                <span>VS</span>
                                <h2 className={`round-result-text ${resultClass}`}>{result}</h2>
                            </div>
                            
                            {/* Afișarea Calculatorului */}
                            <div className="computer-display">
                                <h3>Calculator</h3>
                                {isThinking 
                                    ? <div className="thinking-box">...</div>
                                    : computerImage && <img src={computerImage} alt={choiceMap[computerVal]?.name} className="result-image" />
                                }
                            </div>
                        </div>
                    ) : (
                        <p className="initial-message">{result}</p>
                    )}
                </div>
                
                {/* Secțiunea de scor */}
                <div className="score-board">
                    <div className="player-score">Scorul Tău: <span style={{color: playerScore === MAX_SCORE ? '#ff0000' : 'inherit'}}>{playerScore}</span></div>
                    <div className="computer-score">Scor Calculator: <span style={{color: compScore === MAX_SCORE ? '#ff0000' : 'inherit'}}>{compScore}</span></div>
                </div>

                {/* Buton de Resetare */}
                <button onClick={this.resetGame} className="reset-button">
                    {gameOver ? 'Începe Joc Nou' : 'Resetează Scorul'}
                </button>
            </div>
        )
    }
}

export default Game;