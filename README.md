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
