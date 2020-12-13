import React, { useState, useEffect } from "react";
import { Quiz } from "./Quiz";

export const Quizparent = ({
    match: {
        params: { id },
    },
    history,
}) => {
    // STATE DECLARATIONS
    // this state is used to store the quiz and answers object
    const [state, setState] = useState([]);
    // this state is used to track the currently selected answer choice on the quiz
    const [value, setValue] = useState("");
    // this state is used to display an error if the selecte answer choice is incorrect
    const [error, setError] = useState(false);
    // this state is used to display helper text for correct and incorrect answers
    const [helperText, setHelperText] = useState("Buena Suerte!");
    // this state is used to set the current question and answer choices
    const [question, setQuestion] = useState({
        currentQuestion: "",
        question: "",
        Option1: "",
        Option2: "",
        Option3: "",
        Option4: "",
        questionId: "",
    });

    // this state keeps track of current user response(whether correcr or incorrect)
    // and is used to persist to server
    const [response, setResponse] = useState({
        question_id: null,
        choice_id: null,
    });

    //this state keeps track of quiz results
    const [results, setResults] = useState({
        test_id: 0,
        no_correct: 0,
        no_incorrect: 0,
        user_id: localStorage.user,
        score: 0,
    });

    // Load the quiz into the state
    useEffect(() => {
        const payLoad = {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            }
        };
        fetch(`http://localhost:3000/tests/${id}`, payLoad)
            .then((r) => r.json())
            .then((quizQuestionsObj) => {
                setState(quizQuestionsObj);
                // set the first question with default values
                setQuestion({
                    currentQuestion: 0,
                    question: quizQuestionsObj[0].question,
                    Option1: quizQuestionsObj[0].answers[0],
                    Option2: quizQuestionsObj[0].answers[1],
                    Option3: quizQuestionsObj[0].answers[2],
                    Option4: quizQuestionsObj[0].answers[3],
                    questionId: quizQuestionsObj[0].id,
                });
            });
    }, []);


    // function to keep track of radio values
    const handleRadioChange = (event) => {
        setValue(event.target.value);
        setHelperText(" ");
        setError(false);
    };
    // helper function to get currently selected answer and set response state
    const getSelectedRadio = (e) => {
        let radioSelection = e.target.value;
        const radioSelected = state[question.currentQuestion].answers.find(
            (ans) => {
                return ans.answer === radioSelection;
            }
        );
        setResponse((prevState) => {
            return {
                ...prevState,
                choice_id: radioSelected.id,
                question_id: state[question.currentQuestion].id,
            };
        });
    };

    // retrive current question from state and set it
    const handleQuestionChange = () => {
        return (
            state[question.currentQuestion] &&
            state[question.currentQuestion].question
        );
    };

    // function to update local incorrect question tracking state
    const setIncorrectResults = () => {
        setResults((prevState) => {
            return {
                ...prevState,
                no_incorrect: prevState.no_incorrect + 1,
            };
        });
    };

    // function to update local correct question tracking state
    const setCorrectResults = () => {
        setResults((prevState) => {
            return {
                ...prevState,
                no_correct: prevState.no_correct + 1,
            };
        });
    };
    // function to persist a correct answer to server
    const persistTrueResponse = () => {
        const selectedResponse = {
            user_id: localStorage.user,
            question_id: response.question_id,
            choice_id: response.choice_id,
            is_right: true,
        };
        const answerPayLoad = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.token}`,
            },
            body: JSON.stringify(selectedResponse),
        };
        fetch("http://localhost:3000/user_answers", answerPayLoad)
            .then((r) => r.json())
            .then((persistedObj) => {
                console.log(persistedObj);
            });
    };

    // function to persist incorrect response to server
    const persistFalseResponse = () => {
        const selectedResponse = {
            user_id: localStorage.user,
            question_id: response.question_id,
            choice_id: response.choice_id,
            is_right: false,
        };
        const answerPayLoad = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.token}`,
            },
            body: JSON.stringify(selectedResponse),
        };
        fetch("http://localhost:3000/user_answers", answerPayLoad)
            .then((r) => r.json())
            .then((persistedObj) => {
                console.log(persistedObj);
            });
    };

    // persist total quiz results,only run at the end of quiz
    const persistResults = () => {
        const resultObj = {
            ...results,
            test_id: state[0].test.id,
            score: results.no_correct - results.no_incorrect,
        };

        const createPayload = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.token}`,
            },
            body: JSON.stringify(resultObj),
        };
        fetch("http://localhost:3000/results", createPayload)
            .then((r) => r.json())
            .then((quizQuestionsObj) => {
                console.log(quizQuestionsObj);
            });
        setTimeout(() => history.push("/pruebas"), 3000);
    };

    // a method to randomize questions for this approach
    function shuffle(a) {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }
    // main function that combines all quiz logic based on previous questions
    // and whether the answer is correct and incorrect
    const handleSubmit = (event) => {
        event.preventDefault();
        if (question.currentQuestion + 1 !== state.length) {
            let comparison = state[question.currentQuestion].answers.find((ans) => {
                if (ans.is_correct !== undefined && ans.is_correct === true) {
                    return ans;
                } else {
                    setHelperText("Please select an option.");
                    setError(true);
                }
            });
            if (comparison.answer && comparison.answer === value) {
                persistTrueResponse();
                let arr = shuffle([0, 1, 2, 3]);
                setQuestion((prevState) => {
                    return {
                        currentQuestion: prevState.currentQuestion + 1,
                        question: state[prevState.currentQuestion + 1].question,
                        Option1: state[prevState.currentQuestion + 1].answers[arr[0]],
                        Option2: state[prevState.currentQuestion + 1].answers[arr[1]],
                        Option3: state[prevState.currentQuestion + 1].answers[arr[2]],
                        Option4: state[prevState.currentQuestion + 1].answers[arr[3]],
                    };
                });

                setHelperText("Buen Trabajo!");
                setError(false);
                setCorrectResults();
                persistTrueResponse();
            } else if (comparison.answer && comparison.answer !== value) {
                setHelperText("Lo Siento, Intente Otra vez!");
                setError(true);
                setIncorrectResults();
                persistFalseResponse();
            } else {
                setHelperText("Por favor, seleccione una opcion:");
                setError(true);
            }
        } else {
            setHelperText(
                `Terminaste!Felicidades!, tuviste ${results.no_correct + 1 - results.no_incorrect
                } preguntas correctas!`
            );
        }
        if (question.currentQuestion + 1 === state.length) {
            persistResults();
        }
    }
    return (<>
        <Quiz />
    </>)

}