const DEBUG_FLAG = true;

let guess = '';
let currentRow = 0;
let gameStatus = 'playing';
let evaluations = [];
let boardState = [];
let SECRET_WORD = 'bitch';
let author = 'kevin';
let modalOpen = false;

let canType = true && gameStatus === 'playing';

const exportForm = document.getElementById('export-form');
exportForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const data = new FormData(exportForm);
  const word = data.get('export-input');
  const player = data.get('export-name');
  const error = document.getElementById('export-form-error');
  const hash = document.getElementById('secret-code');
  const codeBlock = document.getElementById('secret-code-block');

  if (word.length !== 5) {
    error.textContent = 'invalid word length';
  } else if (/^[a-zA-Z]+$/.test(word) === false) {
    error.textContent = 'invalid characters in word';
  } else {
    hash.textContent = `${player}-${btoa(word)}`;
    codeBlock.classList.remove('hidden');
  }
});

const importForm = document.getElementById('import-form');
importForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const data = new FormData(importForm);
  const secret = data.get('import-input');

  decodeSecret(secret);
  closeModal('import');
});

const keyboard = document.getElementById('keyboard');
[...keyboard.children].forEach((row) => {
  const keys = [...row.children];
  keys.forEach((key) => {
    key.onclick = () => {
      console.log(key.dataset.key);
      document.dispatchEvent(new KeyboardEvent('keydown', { 'key': key.dataset.key }));
    }
  });
});

document.addEventListener('keydown', (event) => {
  const debug = document.getElementById('debug');
  const keypress = event.key;

  if (canType && gameStatus === 'playing' && !modalOpen) {
    if (keypress === 'Enter' || keypress === 'Backspace') {
      if (keypress === 'Backspace') {
        guess = guess.length > 0 ? guess.slice(0, -1) : guess;
        updateBoard();
      } else if (keypress === 'Enter') {
        if (guess.length < 5) {
          incorrectGuess();
          showToast('not enough letters');
        } else {
          evaluateGuess();
          guess = '';
        }
      }
    } else if (/^[a-zA-Z]+$/.test(keypress) && keypress.length === 1) {
      populateLetters(keypress);
    }
  }

  if (DEBUG_FLAG) {
    document.getElementById('debug').classList.add('visible');
    debug.textContent = JSON.stringify({
      boardState,
      gameStatus,
      guess,
      currentRow,
      SECRET_WORD,
      canType,
      modalOpen
    });
  }
});

const decodeSecret = (secret) => {
  const secretCode = secret.split('-');

  if (atob(secretCode[1]).length !== 5) {
    showToast('error: secret code invalid')
  } else {
    author = secretCode[0]
    SECRET_WORD = atob(secretCode[1]);
    guess = '';
    currentRow = 0;
    gameStatus = 'playing';
    evaluations = [];
    boardState = [];

    showToast(`imported new game from ${author}`);
  }
}

const populateLetters = (letter) => {
  if (guess.length < 5) {
    guess += letter;
  }
  updateBoard();
}

const updateBoard = () => {
  const row = document.getElementById('board').children[currentRow];

  [...row.children].forEach((tile, index) => {
    tile.textContent = guess[index];
    if (index < guess.length) {
      tile.dataset.state = 'guessed';
    } else {
      tile.dataset.state = 'empty';
    }
  });
}

const advanceRow = () => {
  if (currentRow < 5) {
    currentRow += 1;
  } else if (currentRow === 5) {
    gameStatus = 'loss';
    endGame(false);
  }
}

const evaluateGuess = () => {
  const guessMatrix = [];
  const row = document.getElementById('board').children[currentRow];
  const keyboard = document.getElementById('keyboard');
  
  let promise = Promise.resolve();
  let evaluation = SECRET_WORD;

  [...guess].forEach((letter, index) => {
    if (evaluation.includes(letter)) {
      if (evaluation[index] === letter) {
        guessMatrix.push({ letter, state: 'correct' });
        evaluation = evaluation.replace(letter, '_');
      } else {
        guessMatrix.push({ letter, state: 'present' });
        evaluation = evaluation.replace(letter, '_');
      }
    } else {
      guessMatrix.push({ letter, state: 'incorrect' });
    }
  });

  canType = false;
  [...row.children].forEach((tile, index) => {
    promise = promise.then(() => {
      tile.dataset.animation = 'flip';
      setTimeout(() => {
        tile.dataset.state = guessMatrix[index].state;
        tile.dataset.animation = 'idle';
      }, 500);

      return new Promise((resolve) => {
        setTimeout(resolve, 200);
      });
    });
  });

  setTimeout(() => {
    promise.then(() => {
      [...keyboard.children].forEach((row) => {
        [...row.children].forEach((key) => {
          const keyExists = guessMatrix.filter((x) => x.letter === key.dataset.key);
    
          if (keyExists.length > 0) {
            key.dataset.state = key.dataset.state !== 'correct' ? keyExists[0].state : 'correct';
          }
        });
      });
    });

    if (evaluation === '_____' && guessMatrix.map((x) => x.state).filter((x) => x === 'present' || x === 'incorrect').length === 0) {
      endGame(true);
    }

    advanceRow();
    canType = true;
  }, 2000);

  boardState.push(guess);
  evaluations.push(guessMatrix.map((x) => x.state));
  // saveState();
}

const incorrectGuess = () => {
  const row = document.getElementById('board').children[currentRow];
  row.dataset.animation = 'shake';
  setTimeout(() => {
    row.dataset.animation = 'idle';
  }, 200);
}

const showToast = (message) => {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.dataset.show = 'true';

  setTimeout(() => {
    toast.dataset.show = 'false';
  }, 3000);
}

// TODO: finish save state
// const saveState = () => {
//   localStorage.setItem('gameState', JSON.stringify({
//     boardState,
//     evaluations,
//     gameStatus,
//     currentRow,
//   }));
// }

const endGame = (win) => {
  if (win) {
    gameStatus = 'win';
    switch (currentRow) {
      case 0:
        showToast('galaxy brain');
        break;
      case 1:
        showToast('clean');
        break;
      case 2:
        showToast('nice job');
        break;
      case 3:
        showToast('wonderful');
        break;
      case 4:
        showToast('phew');
        break;
      case 5:
        showToast('what a nailbiter');
        break;
      default:
        showToast('yikes');
    }
  } else {
    showToast('feelsbadman');
  }

  setTimeout(() => {
    document.getElementById('share-block').classList.remove('hidden');
    activateModal('share');
  }, 3000);
  // saveState();
}

const copyToClipboard = (result=false) => {
  if (result) {
    const SQUARE_MAP = {
      correct: '🟩',
      incorrect: '⬛',
      present: '🟨'
    };
    let result = `${author} ${evaluations.length} / 6\n`;

    evaluations.forEach((evaluation) => {
      result += `${evaluation.map((x) => SQUARE_MAP[x]).join('')}\n`
    });

    navigator.clipboard.writeText(result).then(() => {
      showToast('copied!');
    }, (err) => {
      console.error(err);
    });
  } else {
    const hash = document.getElementById('secret-code');
    navigator.clipboard.writeText(hash.textContent).then(() => {
      showToast('copied!');
    }, (err) => {
      console.error(err);
    });
  }
}

const activateModal = (name) => {
  const modal = document.getElementById(`${name}-modal`);
  modalOpen = true;
  modal.classList.add('visible');
}

const closeModal = (name) => {
  const modal = document.getElementById(`${name}-modal`);
  modalOpen = false;
  modal.classList.remove('visible');

  if (name === 'import' || name === 'export') {
    resetModal(name);
  }
}

const resetModal = (name) => {
  const form = document.getElementById(`${name}-form`);
  form.reset();

  if (name === 'export') {
    document.getElementById('secret-code').textContent = '';
    document.getElementById('secret-code-block').classList.add('hidden');
  }
}
