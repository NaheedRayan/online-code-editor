import React, { useState } from 'react';
import AceEditor from 'react-ace';
// Import language modes for syntax highlighting
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/mode-java';
import 'ace-builds/src-noconflict/mode-c_cpp';
// Import theme
import 'ace-builds/src-noconflict/theme-monokai';
// Import autocompletion tools
// import 'ace-builds/src-noconflict/ext-language_tools';

import './CodeRunner.css';

// Navbar component
const Navbar = () => (
  <nav className="navbar">
    <div className="navbar-brand">Code Compiler</div>
    <ul className="navbar-links">
      <li><a href="#home">Home</a></li>
      <li><a href="#about">About</a></li>
      <li><a href="#contact">Contact</a></li>
    </ul>
  </nav>
);

// CodeEditor component using Ace Editor with code completion
const CodeEditor = ({ code, setCode, language }) => (
  <AceEditor
    mode={language}
    theme="monokai"
    name="code-editor"
    onChange={setCode}
    fontSize={16}
    value={code}
    width="100%"
    height="calc(100% - 40px)"
    editorProps={{ $blockScrolling: true }}
    setOptions={{
      // enableBasicAutocompletion: true,    // Enable basic autocompletion
      // enableLiveAutocompletion: true,     // Enable live autocompletion
      // enableSnippets: true,               // Enable code snippets
      showLineNumbers: true,              // Show line numbers
      tabSize: 4,                         // Set tab size
    }}
  />
);

// Output component to display code execution results
const Output = ({ output }) => (
  <div className="output" aria-live="polite">
    <pre>{output}</pre>
  </div>
);

// StdinInput component for user input
const StdinInput = ({ stdin, setStdin }) => (
  <textarea
    placeholder="Enter stdin here..."
    value={stdin}
    onChange={(e) => setStdin(e.target.value)}
    className="stdin"
    aria-label="Standard input"
  />
);

// LanguageSelector component for choosing programming language
const LanguageSelector = ({ language, setLanguage }) => (
  <select 
    value={language} 
    onChange={(e) => setLanguage(e.target.value)}
    aria-label="Select programming language"
  >
    <option value="python">Python</option>
    <option value="java">Java</option>
    <option value="c_cpp">C/C++</option>
  </select>
);

// Main CodeRunner component
const CodeRunner = () => {
  // State hooks for managing component state
  const [code, setCode] = useState(`print("Hello world")`);
  const [stdin, setStdin] = useState('');
  const [output, setOutput] = useState('Output Terminal');
  const [language, setLanguage] = useState('python');
  const [isRunning, setIsRunning] = useState(false);

  // Function to simulate code execution
  const runCode = async () => {
    const url = 'http://localhost:8080/submit';

    setIsRunning(true);
    
    const fileExtensionMap = {
      'c_cpp': 'cpp',
      'python': 'python3',
      'java': 'java'
    };
    
  
    // Payload for the POST request
    const payload = {
      src: code,
      stdin: stdin,
      lang: fileExtensionMap[language],
      timeout: "5",
    };
  
    try {
      console.log('Submitting code...');
      setOutput("Submitting code...")

      // Send the POST request to the server
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        setOutput("Failed to submit code")
        throw new Error(`Failed to submit code: ${response.statusText}`);
      }
  
      // we will get unique link with id
      const resultUrl = await response.text();

  
  
      // Polling function to check the result every second
      const pollResult = async () => {
        try {
          const resultResponse = await fetch(resultUrl);
  
          if (!resultResponse.ok) {
            setOutput(`Failed to fetch result: ${resultResponse.statusText}`)
            throw new Error(`Failed to fetch result: ${resultResponse.statusText}`);
          }
  
          const resultData = await resultResponse.json();
  
          switch (resultData.status) {
            case 'Queued':
            case 'Processing':
              setOutput(`Status: ${resultData.status}. Checking again in 1 second...`)
              console.log(`Status: ${resultData.status}. Checking again in 1 second...`);
              setTimeout(pollResult, 1000); // Check again in 1 second
              break;
  
            case 'Runtime Error':
              setOutput(`Runtime Error: ${resultData.stderr}`)
              console.error(`Runtime Error: ${resultData.stderr}`);
              setIsRunning(false)
              break;
  
            case 'Failed':
              setOutput(`Failed: ${resultData.stderr}`)
              setOutput(`Output:\n${resultData.output}`);
              console.log(`Failed: ${resultData.stderr}`);
              setIsRunning(false)
              break;
  
            case 'Successful':
              console.log('Script executed successfully!');
              console.log('Output:', resultData.output);
              setOutput(`Output:\n${resultData.output}`);
              setIsRunning(false)
              break;
  
            default:
              console.log('Unknown status:', resultData.status);
          }
        } catch (error) {
          console.error('Error during polling:', error.message);
        }
      };
  
      // Start polling the result
      pollResult();
  
    } catch (error) {
      setIsRunning(false)
      setOutput(`Error: ${error.message}`)
      console.error('Error:', error.message);
    }
  };
  

  // Render the main component
  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="code-section">
          <CodeEditor code={code} setCode={setCode} language={language} />
          <div className="button-container">
            <LanguageSelector language={language} setLanguage={setLanguage} />
            <button 
              onClick={runCode} 
              className="run-button"
              disabled={isRunning}
              aria-busy={isRunning}
            >
              {isRunning ? 'Running...' : 'Run'}
            </button>
          </div>
        </div>
        <div className="output-input-section">
          <Output output={output} />
          <StdinInput stdin={stdin} setStdin={setStdin} />
        </div>
      </div>
    </div>
  );
};

export default CodeRunner;
