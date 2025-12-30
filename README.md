# Bassist Companion 🎸

A web-based practice companion designed specifically for bass players. This application combines a library of legendary bass licks, interactive tablature, a built-in drum machine, a chromatic tuner, and AI-powered lick generation to help you improve your groove and creativity.

## ✨ Features

*   **Practice Room:** Interactive player with adjustable tempo and synthesized bass audio.
*   **Lick Library:** Categorized licks (Warm-up, Scales, Arpeggios, Walking Bass, Funk) tailored for Beginner, Intermediate, and Advanced players.
*   **AI Lick Generator:** Integrated with **Google Gemini** to generate infinite, unique bass lines and exercises on the fly based on difficulty and key.
*   **Dynamic Tablature:** Visual tab generation that adapts to the generated notes.
*   **Drum Machine:** Built-in beat maker with presets (Rock, Funk, Swing, etc.) and individual sample customization (808s, Acoustic, etc.).
*   **Chromatic Tuner:** Real-time pitch detection to keep your bass in tune.
*   **Web Audio Synth:** Custom sound engine simulating various bass tones (J-Bass, P-Bass, Synth, Muted Pick).

## 🛠️ Tech Stack

*   **Frontend:** React 19, TypeScript
*   **Styling:** Tailwind CSS
*   **Audio:** Web Audio API (No external audio libraries used)
*   **AI:** Google Gemini API (`@google/genai`)

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18 or higher)
*   npm or yarn
*   A Google Gemini API Key

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/bassist-companion.git
    cd bassist-companion
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  **Security Setup (Crucial):**
    Create a `.env` file in the root directory. You can copy the example file:
    ```bash
    cp .env.example .env
    ```

4.  Add your API Key to the `.env` file:
    ```env
    # Get your key at https://aistudio.google.com/
    API_KEY=your_actual_api_key_here
    ```
    > **⚠️ WARNING:** Never commit your `.env` file to GitHub. It is already added to `.gitignore` to prevent accidental leaks.

5.  Run the development server:
    ```bash
    npm run dev
    ```

## 🎮 How to Use

1.  **Select Difficulty:** Choose between Beginner, Intermediate, or Advanced.
2.  **Browse or Generate:** Pick a pre-defined lick or click "✨ Generate New Lick" to let Gemini create a custom exercise for you.
3.  **Practice:**
    *   Use the **Play** button to hear the lick.
    *   Adjust the **BPM** slider to match your speed.
    *   Change the **Bass Sound** to match the genre.
    *   Turn on the **Drum Machine** for a backing beat.
4.  **Tools:** Access the Tuner or Beat Maker directly from the home screen.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).