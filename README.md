# LeafLLM: an AI-powered Overleaf
This Chrome extension adds the power of large-language models (LLMs) to Overleaf through a Chrome extension.

The extension originated from [GPT4Overleaf](https://github.com/e3ntity/gpt4overleaf).

## Manual installation
1. Clone the repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable developer mode
4. Click "Load unpacked" and select the repository folder

## Installation from Chrome Web Store (preferred option)
Unless you are a developer, this is probably your preferred option.

Just go to the [extension's page](https://chrome.google.com/webstore/detail/leafllm/feomoidgfifpofabcapiipjjjoigjeoa) in Chrome Web Store and press "Add to Chrome"

## Configuration
The plugin can be configured by clicking the plugin button in the Chrome toolbar. It requires inserting an API key from [OpenAI](https://platform.openai.com/account/api-keys). You also need to choose which tools you wish to enable.

## Usage
These are the tools that are currently available:

### Auto-complete
Select a text and press `Alt+C` to trigger the auto-complete tool.

### Improve
Select a text and press `Alt+I` to trigger the improvement tool. The original text will be commented out and the improved text will be inserted below it.

### Ask
Select a text and press `Alt+A` to trigger the ask tool. The original text will be deleted and the answer will be inserted in its place. 

For example: "Create a table 4x3 that the first row is bold face" will be replaced with, e.g.,:
```latex
\begin{tabular}{|c|c|c|}
\hline
\textbf{Column 1} & \textbf{Column 2} & \textbf{Column 3}\\
\hline
Entry 1 & Entry 2 & Entry 3\\
\hline
Entry 4 & Entry 5 & Entry 6\\
\hline
Entry 7 & Entry 8 & Entry 9\\
\hline
\end{tabular}
```

You can then, for example:
1. Write before the table: Place the following tabular inside a table environment, center it, and give the following title: "The comparison of the three approaches"
2. Select the sentence and the table
3. Press `Alt+a` to trigger the ask tool. 

The result will be:
```latex
\begin{table}[h]
\centering
\caption{The comparison of the three approaches}
\begin{tabular}{|c|c|c|}
\hline
\textbf{Column 1} & \textbf{Column 2} & \textbf{Column 3}\\
\hline
Entry 1 & Entry 2 & Entry 3\\
\hline
Entry 4 & Entry 5 & Entry 6\\
\hline
Entry 7 & Entry 8 & Entry 9\\
\hline
\end{tabular}
\end{table}
```

## Issues
If you encounter any issues, please open an issue in the project's repository.

## Privacy
The plugin does not collect any data. The only data that is sent is the text that you select and the API key that you provide. The data is sent to OpenAI's servers only.
