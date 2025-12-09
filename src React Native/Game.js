import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Image, 
    Modal, 
    SafeAreaView, 
    useColorScheme,
    Dimensions,
    Platform
} from 'react-native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';

// --- IMPORTURI IMAGINI ---
const rockImg = require('./assets/rock.png');
const paperImg = require('./assets/paper.png');
const scissorsImg = require('./assets/scissors.png');
const lizardImg = require('./assets/lizard.png');
const spockImg = require('./assets/spock.png');

// --- IMPORTURI SUNETE ---
const winSoundFile = require('./assets/win.mp3');
const loseSoundFile = require('./assets/lose.mp3');
const clickSoundFile = require('./assets/click.mp3');

// --- IMPORTURI ANIMAȚII (JSON) ---
const winnerAnim = require('./assets/winner.json');
const loserAnim = require('./assets/loser.json');

const { width, height } = Dimensions.get('window');

// Calcul butoane (3 pe rând)
const BUTTON_SIZE = (width - 70) / 3;

const MAX_SCORE = 5; 
const TIME_LIMIT = 5;
const ALL_CHOICES = ['ROCK', 'PAPER', 'SCISSORS', 'LIZARD', 'SPOCK'];

const choiceMap = {
    ROCK: { name: 'Piatră', image: rockImg, color: '#FF6B6B' },
    PAPER: { name: 'Hârtie', image: paperImg, color: '#4ECDC4' },
    SCISSORS: { name: 'Foarfecă', image: scissorsImg, color: '#FFE66D' },
    LIZARD: { name: 'Șopârlă', image: lizardImg, color: '#A682FF' },
    SPOCK: { name: 'Spock', image: spockImg, color: '#1A535C' },
};

const beatsMap = {
    ROCK: ['LIZARD', 'SCISSORS'],
    PAPER: ['ROCK', 'SPOCK'],
    SCISSORS: ['PAPER', 'LIZARD'],
    LIZARD: ['SPOCK', 'PAPER'],
    SPOCK: ['SCISSORS', 'ROCK']
};

const determineRoundWinner = (playerVal, computerVal) => {
    if (playerVal === computerVal) return 0; 
    if (beatsMap[computerVal].includes(playerVal)) return -1; 
    return 1; 
}

const getComputerChoice = (difficulty, lastPlayerChoice) => {
    if (difficulty === 'EASY' || !lastPlayerChoice) {
        const randomIndex = Math.floor(Math.random() * ALL_CHOICES.length);
        return ALL_CHOICES[randomIndex];
    }
    const chance = Math.random();
    if (chance < 0.3) { 
        const winningChoices = Object.keys(beatsMap).filter(key => beatsMap[key].includes(lastPlayerChoice));
        if (winningChoices.length > 0) {
            return winningChoices[Math.floor(Math.random() * winningChoices.length)];
        }
    }
    const randomIndex = Math.floor(Math.random() * ALL_CHOICES.length);
    return ALL_CHOICES[randomIndex];
};

const Game = () => {
    const colorScheme = useColorScheme();
    const [playerVal, setPlayerVal] = useState(null);
    const [computerVal, setComputerVal] = useState(null);
    const [playerScore, setPlayerScore] = useState(0);
    const [compScore, setCompScore] = useState(0);
    const [result, setResult] = useState(`Primul la ${MAX_SCORE} câștigă!`);
    const [isThinking, setIsThinking] = useState(false); 
    const [gameOver, setGameOver] = useState(false);
    const [isDark, setIsDark] = useState(colorScheme === 'dark'); 
    const [timer, setTimer] = useState(TIME_LIMIT);
    const [difficulty, setDifficulty] = useState('EASY');
    const [lastPlayerChoice, setLastPlayerChoice] = useState(null);

    const animationRef = useRef(null);
    const [showAnimation, setShowAnimation] = useState(null);
    const [showModal, setShowModal] = useState(false);
    
    const playSound = async (soundFile) => {
        try {
            const { sound } = await Audio.Sound.createAsync(soundFile);
            await sound.playAsync();
        } catch (error) {
            console.log('Eroare sunet', error);
        }
    };

    const startTimer = () => {
        setTimer(TIME_LIMIT);
    }
    
    useEffect(() => {
        let interval = null;
        if (!gameOver && !isThinking && !showModal) {
            interval = setInterval(() => {
                setTimer(prevTimer => {
                    if (prevTimer > 1) {
                        return prevTimer - 1;
                    } else {
                        clearInterval(interval);
                        return 0;
                    }
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [gameOver, isThinking, difficulty, playerScore, compScore, showModal]);

    useEffect(() => {
        if (timer === 0 && !gameOver && !isThinking && playerVal === null) {
            handleTimeoutLoss();
        }
    }, [timer]);
    
    const triggerAnimation = (type) => {
        setShowAnimation(type);
        if (animationRef.current) {
            animationRef.current.play();
        }
        setTimeout(() => {
            setShowAnimation(null);
        }, 3000);
    };

    const handleTimeoutLoss = () => {
        setPlayerVal('TIMEOUT');
        setIsThinking(true);
        setResult('Timpul a expirat!');
        playSound(loseSoundFile);

        setTimeout(() => {
            const compChoice = getComputerChoice(difficulty, lastPlayerChoice);
            setCompScore(prevScore => {
                const finalCompScore = prevScore + 1;
                const isGameOver = finalCompScore === MAX_SCORE;
                
                setComputerVal(compChoice);
                setResult(isGameOver ? "JOC TERMINAT! AI PIERDUT." : 'Ai pierdut runda.');
                setIsThinking(false);
                setGameOver(isGameOver);
                
                if (isGameOver) {
                    triggerAnimation('LOSE'); 
                    setTimeout(() => {
                        setShowModal(true);
                    }, 3000);
                }
                return finalCompScore;
            });
        }, 500);
    }

    const decision = (playerChoice) => {
        if (gameOver || isThinking) return;
        
        playSound(clickSoundFile);
        setPlayerVal(playerChoice); 
        setComputerVal(null); 
        setIsThinking(true);
        setResult('Gândesc...'); 

        setTimeout(() => {
            const compChoice = getComputerChoice(difficulty, playerChoice);
            const val = determineRoundWinner(playerChoice, compChoice);
            let newResult;
            let finalPlayerScore = playerScore;
            let finalCompScore = compScore;

            if (val === 1) {
                newResult = "Ai Câștigat!";
                finalPlayerScore += 1;
                playSound(winSoundFile);
            } else if (val === -1) {
                newResult = "Ai Pierdut.";
                finalCompScore += 1;
                playSound(loseSoundFile);
            } else {
                newResult = "Egalitate!";
            }

            let isGameOver = false;
            let finalMessage = newResult;

            if (finalPlayerScore === MAX_SCORE) {
                finalMessage = "FELICITĂRI! AI CÂȘTIGAT!";
                isGameOver = true;
                triggerAnimation('WIN'); 
            } else if (finalCompScore === MAX_SCORE) {
                finalMessage = "JOC TERMINAT! AI PIERDUT.";
                isGameOver = true;
                triggerAnimation('LOSE'); 
            }

            setComputerVal(compChoice);
            setPlayerScore(finalPlayerScore);
            setCompScore(finalCompScore);
            setResult(finalMessage);
            setIsThinking(false);
            setGameOver(isGameOver);
            setLastPlayerChoice(playerChoice);

            if (isGameOver) {
                setTimeout(() => {
                    setShowModal(true);
                }, 3000);
            }
        }, 500); 
    }

    const resetGame = () => {
        setPlayerVal(null);
        setComputerVal(null);
        setPlayerScore(0);
        setCompScore(0);
        setResult(`Primul la ${MAX_SCORE} câștigă!`);
        setIsThinking(false);
        setGameOver(false);
        setTimer(TIME_LIMIT);
        setLastPlayerChoice(null);
        setShowAnimation(null);
        setShowModal(false); 
    }
    
    const toggleDarkMode = () => setIsDark(prev => !prev);
    const setDifficultyLevel = (level) => { setDifficulty(level); resetGame(); }

    const bgGradient = isDark ? ['#0f0c29', '#302b63', '#24243e'] : ['#89f7fe', '#66a6ff'];
    const cardBg = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)';
    const textColor = isDark ? '#ffffff' : '#2c3e50';
    const subTextColor = isDark ? '#cccccc' : '#555555';

    const playerImage = playerVal && playerVal !== 'TIMEOUT' ? choiceMap[playerVal].image : null;
    const computerImage = computerVal ? choiceMap[computerVal]?.image : null;

    const isWin = playerScore === MAX_SCORE;
    const modalTitle = isWin ? "VICTORIE!" : "ÎNFRÂNGERE";
    const modalColor = isWin ? "#4CAF50" : "#F44336";
    const modalEmoji = isWin ? "🏆" : "💀";

    return (
        <LinearGradient colors={bgGradient} style={styles.mainContainer}>
            <SafeAreaView style={styles.safeArea}>
                {/* AM ÎNLOCUIT ScrollView CU View PENTRU A EVITA SCROLL-UL */}
                <View style={styles.contentContainer}>
                    
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={{flex: 1, paddingRight: 10}}>
                            <Text style={[styles.title, { color: textColor }]}>
                                Piatră Hârtie Foarfecă Șopârlă Spock
                            </Text>
                        </View>
                        <TouchableOpacity onPress={toggleDarkMode} style={styles.themeButton}>
                            <Text style={{fontSize: 20}}>{isDark ? '☀️' : '🌙'}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Dificultate */}
                    <View style={styles.difficultyContainer}>
                        <TouchableOpacity 
                            onPress={() => setDifficultyLevel('EASY')} 
                            style={[styles.diffBtn, difficulty === 'EASY' && styles.diffBtnActive, {borderColor: difficulty === 'EASY' ? '#4CAF50' : 'transparent'}]}
                        >
                            <Text style={[styles.diffText, {color: difficulty === 'EASY' ? '#4CAF50' : subTextColor}]}>UȘOR</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => setDifficultyLevel('HARD')} 
                            style={[styles.diffBtn, difficulty === 'HARD' && styles.diffBtnActive, {borderColor: difficulty === 'HARD' ? '#F44336' : 'transparent'}]}
                        >
                            <Text style={[styles.diffText, {color: difficulty === 'HARD' ? '#F44336' : subTextColor}]}>EXPERT</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Scor */}
                    <View style={[styles.scoreCard, { backgroundColor: cardBg }]}>
                        <View style={styles.scoreItem}>
                            <Text style={[styles.scoreLabel, { color: subTextColor }]}>TU</Text>
                            <Text style={[styles.scoreValue, { color: textColor }]}>{playerScore}</Text>
                        </View>
                        <View style={styles.timerContainer}>
                            <Text style={[styles.timerValue, { color: timer <= 2 ? '#ff4757' : textColor }]}>{timer}</Text>
                            <Text style={[styles.timerLabel, { color: subTextColor }]}>SEC</Text>
                        </View>
                        <View style={styles.scoreItem}>
                            <Text style={[styles.scoreLabel, { color: subTextColor }]}>CPU</Text>
                            <Text style={[styles.scoreValue, { color: textColor }]}>{compScore}</Text>
                        </View>
                    </View>

                    {/* ARENA ELASTICĂ (flex: 1) - Umple spațiul rămas */}
                    <View style={[styles.arenaCard, { backgroundColor: cardBg }]}>
                        <View style={styles.fighterBox}>
                            {playerVal && playerVal !== 'TIMEOUT' ? (
                                <Image source={playerImage} style={styles.fighterImage} />
                            ) : (
                                <View style={[styles.placeholderCircle, { borderColor: subTextColor }]}>
                                    <Text style={{fontSize: 30}}>👤</Text>
                                </View>
                            )}
                            <Text style={[styles.fighterName, {color: subTextColor}]}>{playerVal ? choiceMap[playerVal]?.name : 'Alege'}</Text>
                        </View>

                        <View style={styles.vsContainer}>
                            <Text style={styles.vsText}>VS</Text>
                        </View>

                        <View style={styles.fighterBox}>
                            {isThinking ? (
                                <View style={styles.loadingCircle}><Text style={{fontSize: 20}}>💭</Text></View>
                            ) : computerImage ? (
                                <Image source={computerImage} style={styles.fighterImage} />
                            ) : (
                                <View style={[styles.placeholderCircle, { borderColor: subTextColor }]}>
                                    <Text style={{fontSize: 30}}>🤖</Text>
                                </View>
                            )}
                            <Text style={[styles.fighterName, {color: subTextColor}]}>{computerVal ? choiceMap[computerVal]?.name : 'Așteaptă'}</Text>
                        </View>
                    </View>

                    <View style={styles.resultContainer}>
                        <Text style={[styles.resultText, { color: textColor }]}>{result}</Text>
                    </View>

                    {/* Grilă Butoane */}
                    <View style={styles.choicesGrid}>
                        {ALL_CHOICES.map((choiceKey) => (
                            <TouchableOpacity 
                                key={choiceKey} 
                                onPress={() => decision(choiceKey)}
                                disabled={isThinking || gameOver}
                                style={[
                                    styles.choiceBtn, 
                                    { 
                                        borderColor: choiceMap[choiceKey].color,
                                        shadowColor: choiceMap[choiceKey].color,
                                        backgroundColor: isDark ? '#2d3436' : '#ffffff'
                                    },
                                    (isThinking || gameOver) && { opacity: 0.5 }
                                ]}
                            >
                                <Image source={choiceMap[choiceKey].image} style={styles.choiceIcon} />
                                <Text style={[styles.choiceLabel, { color: choiceMap[choiceKey].color }]}>
                                    {choiceMap[choiceKey].name.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity onPress={resetGame} style={styles.resetBtn}>
                        <Text style={styles.resetBtnText}>{gameOver ? 'JOACĂ DIN NOU' : 'RESETARE'}</Text>
                    </TouchableOpacity>

                </View>
            </SafeAreaView>

            <Modal
                animationType="fade"
                transparent={true}
                visible={showModal}
                onRequestClose={() => {}}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { backgroundColor: isDark ? '#2d3436' : 'white' }]}>
                        <View style={[styles.modalHeader, { backgroundColor: modalColor }]}>
                            <Text style={styles.modalEmoji}>{modalEmoji}</Text>
                        </View>
                        
                        <View style={styles.modalBody}>
                            <Text style={[styles.modalTitle, { color: modalColor }]}>{modalTitle}</Text>
                            <Text style={[styles.modalMessage, { color: isDark ? '#dfe6e9' : '#636e72' }]}>
                                {isWin ? "Felicitări! Ai demonstrat că ești un maestru." : "Nu te da bătut! Norocul se va întoarce."}
                            </Text>
                            
                            <TouchableOpacity 
                                onPress={resetGame} 
                                style={[styles.modalButton, { backgroundColor: modalColor }]}
                            >
                                <Text style={styles.modalButtonText}>JOACĂ DIN NOU</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {showAnimation && (
                <View style={styles.lottieContainer} pointerEvents="none">
                    <LottieView
                        ref={animationRef}
                        source={showAnimation === 'WIN' ? winnerAnim : loserAnim}
                        autoPlay
                        loop={showAnimation === 'WIN'} 
                        resizeMode={showAnimation === 'WIN' ? "cover" : "contain"}
                        style={[
                            styles.lottie, 
                            showAnimation === 'LOSE' && styles.lottieSmall 
                        ]}
                    />
                </View>
            )}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    mainContainer: { flex: 1 },
    safeArea: { flex: 1 },
    
    // Noul Container Flexibil
    contentContainer: { 
        flex: 1, 
        paddingHorizontal: 20, 
        paddingBottom: 20, // Spațiu jos pentru a nu lipi resetul de margine
        justifyContent: 'space-between' // Distribuie elementele pe verticală
    },
    
    // Header compactat
    header: { 
        width: '100%', 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginTop: Platform.OS === 'android' ? 40 : 10, // Ajustare fină pentru notch
        marginBottom: 10 
    },
    title: { 
        fontSize: 20, 
        fontWeight: '800', 
        letterSpacing: 0.5,
        flexWrap: 'wrap',
    },
    themeButton: { padding: 8, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 20 },

    difficultyContainer: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 15, padding: 3, marginBottom: 10 },
    diffBtn: { paddingVertical: 6, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: 'transparent' },
    diffBtnActive: { backgroundColor: 'white', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 },
    diffText: { fontWeight: '700', fontSize: 11 },

    scoreCard: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 15, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    scoreItem: { alignItems: 'center' },
    scoreLabel: { fontSize: 10, fontWeight: 'bold', marginBottom: 2 },
    scoreValue: { fontSize: 22, fontWeight: '900' },
    timerContainer: { alignItems: 'center', width: 60 },
    timerValue: { fontSize: 28, fontWeight: 'bold' },
    timerLabel: { fontSize: 9, fontWeight: 'bold' },

    // ARENA FLEXIBILĂ
    arenaCard: { 
        flex: 1, // Ocupă tot spațiul disponibil
        flexDirection: 'row', 
        width: '100%', 
        // height eliminat
        justifyContent: 'space-around', 
        alignItems: 'center', 
        borderRadius: 20, 
        padding: 10, 
        marginBottom: 10, 
        borderWidth: 1, 
        borderColor: 'rgba(255,255,255,0.2)',
        minHeight: 120 // Înălțime minimă de siguranță
    },
    fighterBox: { alignItems: 'center', width: 90 },
    fighterImage: { width: 70, height: 70, resizeMode: 'contain', marginBottom: 5 },
    placeholderCircle: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 5, opacity: 0.5 },
    loadingCircle: { width: 60, height: 60, justifyContent: 'center', alignItems: 'center' },
    fighterName: { fontSize: 12, fontWeight: '600' },
    vsContainer: { justifyContent: 'center', alignItems: 'center' },
    vsText: { fontSize: 20, fontWeight: '900', color: '#ff4757', fontStyle: 'italic' },

    resultContainer: { marginBottom: 10, minHeight: 25 },
    resultText: { fontSize: 16, fontWeight: '700', textAlign: 'center', textTransform: 'uppercase' },

    choicesGrid: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        justifyContent: 'center', 
        gap: 8, 
        width: '100%' 
    },
    choiceBtn: {
        width: BUTTON_SIZE, 
        height: BUTTON_SIZE, 
        borderRadius: 18,
        borderWidth: 2.5,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        padding: 4,
    },
    choiceIcon: {
        width: '50%',
        height: '50%',
        resizeMode: 'contain',
        marginBottom: 3,
    },
    choiceLabel: {
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 0.5,
    },

    resetBtn: { marginTop: 15, paddingVertical: 12, paddingHorizontal: 30, backgroundColor: '#ff6b6b', borderRadius: 25, shadowColor: "#ff6b6b", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
    resetBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },

    lottieContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
        backgroundColor: 'rgba(0,0,0,0.3)'
    },
    lottie: {
        width: width,
        height: height,
    },
    lottieSmall: {
        width: width * 0.8, 
        height: width * 0.8,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)', 
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '85%',
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    modalHeader: {
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalEmoji: {
        fontSize: 50,
    },
    modalBody: {
        padding: 25,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 28,
        fontWeight: '900',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    modalMessage: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 22,
    },
    modalButton: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        elevation: 3,
        width: '100%',
    },
    modalButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        textAlign: 'center',
        textTransform: 'uppercase',
    }
});

export default Game;