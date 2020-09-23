#!/bin/bash

SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
  DIR="$( cd -P "$( dirname "$SOURCE" )" >/dev/null 2>&1 && pwd )"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE" # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
done
DIR="$( cd -P "$( dirname "$SOURCE" )" >/dev/null 2>&1 && pwd )"

cd $DIR
cd ..

SESSION="toloframework-vscode-extension"
if [ -z "$(byobu-tmux list-sessions | grep $SESSION)" ]
then
    byobu-tmux new-session -d -t $SESSION # creates a new detached byobu-tmux session

    byobu-tmux new-window
    byobu-tmux rename-window "TFW VSCode Ext"
    byobu-tmux send-keys -t 0 'code  .' 'C-m'
    byobu-tmux split-window -h
    byobu-tmux send-keys -t 1 'npm start' 'C-m'
fi
# Enter byobu-tmux
byobu-tmux attach -t $SESSION