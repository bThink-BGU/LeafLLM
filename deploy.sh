echo "Packaging extension for submission to the Chrome Web Store."

zip -r LeafLLM.zip ./* -x .git/**\* -x .idea/**\* -x .gitignore -x deploy.sh -x README.md
