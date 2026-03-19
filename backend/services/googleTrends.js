const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const resolvePythonExecutable = () => {
  if (process.env.PYTHON_EXECUTABLE) {
    return process.env.PYTHON_EXECUTABLE;
  }

  const localVenvPython = process.platform === 'win32'
    ? path.join(__dirname, '../venv/Scripts/python.exe')
    : path.join(__dirname, '../venv/bin/python');

  if (fs.existsSync(localVenvPython)) {
    return localVenvPython;
  }

  return process.platform === 'win32' ? 'python' : 'python3';
};

const getTrendingTopics = () => {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '../python/googleTrends.py');
    const pythonExecutable = resolvePythonExecutable();

    const pyProcess = spawn(pythonExecutable, [pythonScript]);

    let data = '';
    let errorData = '';

    pyProcess.stdout.on('data', (chunk) => {
      data += chunk.toString();
    });

    pyProcess.stderr.on('data', (chunk) => {
      errorData += chunk.toString();
    });

    pyProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python script exited with code ${code}: ${errorData}`);
        return resolve([]); // Fallback to empty list
      }
      try {
        const parsedData = JSON.parse(data);
        if (parsedData.error) {
          console.error(`Python script error: ${parsedData.error}`);
          return resolve([]);
        }
        resolve(parsedData);
      } catch (err) {
        console.error('Error parsing Python output:', err);
        resolve([]);
      }
    });

    pyProcess.on('error', (error) => {
      console.error(`Failed to start Python process with "${pythonExecutable}":`, error);
      resolve([]);
    });
  });
};

module.exports = {
  getTrendingTopics,
};
