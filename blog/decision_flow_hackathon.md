# Reducing decision fatigue with Decision Flow

Built with David C. Ippisch, Sapnil Basnet, and Raj Akula at AI Tinkerers Austin. Theme: generative UI.

Try using ChatGPT to make a real decision. You type your situation into a paragraph. It comes back with a wall of text, half explanation, the rest a list of clarifying questions. Now you have to type answers to all of them in another paragraph. After two or three rounds you are tired and still do not have an answer. The model did not make the decision harder. The interface did.

## The idea

Decision Flow flips the format. Instead of a wall of questions, you get one question at a time. Instead of typing a wall of answers, you pick from pre-defined options that fit the question: yes or no, a few labeled choices, a map you can choose a drop a pin at, choices from generated images. The cognitive load per step is tiny. You make the decision faster and you have energy left over for the next one.

The model's job is not to decide for you. It picks the right question at the right time and structures the answer space so you only have to think about one thing at a time.

## Algorithm

1. You enter the decision you are trying to make.
2. A language model generates five personalized clarifying questions.
3. Each question comes with an input shape that matches it: a yes/no card, labeled choices, a map, a sliding scale option, or generated images to choose from.
4. You answer them one at a time.
5. The model synthesizes your answers into a reasoned verdict.

## Generative UI generates the right experience for each question

Pre-defined options only reduce fatigue if the options match the question. Some of the time a yes/no option is a natural fit for the question, but some of the time the question needs a sliding scale response or even for you to select a design or place on a map. 

## Implementation

Single HTML file, vanilla JavaScript, Gemini called twice. Once to generate the questions, once to synthesize the verdict. Each widget runs in an iframe so its state stays isolated and it can talk back to the host via postMessage. We could have reached for a framework, but the hackathon clock made a single file faster to iterate on.

## What's next

The current version avoids waiting on the model between questions, which would add considerable lag. The next iteration will be to continuously generate new questions in the background based on the current pattern of answer:

* Generate a larger pool of candidate questions up front with the LLM.
* Pick the next-best question from that pool using a decision tree over the answers so far, so each step is local and fast.
* Keep generating new candidate questions in the background while the user is answering the current one.

The LLM still does the open-ended work of inventing good questions. The decision tree does the cheap work of picking which one to use because it will provide the greatest information gain.

## Links

* Code: [github.com/ZacCarrico/decide](https://github.com/ZacCarrico/decide)
* Demo video: [youtube.com/watch?v=aLON5mxzJyg](https://www.youtube.com/watch?v=aLON5mxzJyg)
* Hackathon entry: [austin.aitinkerers.org](https://austin.aitinkerers.org/hackathons/h_13f4Kuw0QJs/entries/ht_TP2HgpHp2aI)
