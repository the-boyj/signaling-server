[![Codacy Badge](https://api.codacy.com/project/badge/Grade/7cd72c088ab145e8a4aedec94eb75f4d)](https://www.codacy.com/app/jadenjack/signaling-server?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=the-boyj/signaling-server&amp;utm_campaign=Badge_Grade)

# After clone
```zsh
rm -rf .git && git init && npm install

// If you want to config pre-commit for checking eslint
cp ./resource/hooks/* ./.git/hooks/
```

# Execution
* npm start
* npm test (run all unit tests with mocha)

# Debug (in Intellij)
![](./resource/debug_start.jpg)
![](./resource/debug_test.jpg)
