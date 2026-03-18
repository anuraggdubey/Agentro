const { spawn } = require('child_process');
const path = require('path');

const getTrendingTopics = () => {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '../python/googleTrends.py');
    const venvPython = process.platform === 'win32'
      ? path.join(__dirname, '../venv/Scripts/python.exe')
      : path.join(__dirname, '../venv/bin/python');

    const pyProcess = spawn(venvPython, [pythonScript]);

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
  });
};

module.exports = {
  getTrendingTopics,
};
