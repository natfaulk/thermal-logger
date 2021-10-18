# Thermal Camera Viewer and Logger

Note: If you aren't a Massey Uni Student, then this repo probably isn't very helpful as its rather specific to the custom hardware/firmware used on our AMG8833 devices.

## Setup
Nodejs is required, install from [here](https://nodejs.org/en/). If you are using linux or mac osx I reccomend using [Node Version Manager](https://github.com/nvm-sh/nvm) to install instead.  

Download the files in this repository - either using git:
`git clone https://github.com/natfaulk/thermal-logger.git` or download the files using the download zip option on github.  

Open a powershell / command prompt / terminal etc inside the downloaded folder (Windows has a handy File->Open Windows Powershell option in file explorer. Else cd and dir/ls are your friends...)  

Run `npm install` to install the project's dependencies  

## To run
The program autodetects any attached thermal cameras at startup but not once it is running. If one plugs in another camera one needs to restart the program (its possible to not have it do this, but too much effort to implement for now...) so plug the camera(s) in before running.  

To run: `npm start`  

## Exiting the program
Click on the terminal window and spam `ctrl-c` until it exits... Or just close the terminal window. At some point I might add a more graceful shutdown...

## Saving data
To save data click the begin recording button. To stop, click the stop recording button. If you exit without clicking stop recording, you ***may*** lose data, but no guarentee either way. Any data already written to the file should be fine, but it buffers writes into batches so one could lose a few seconds worth (or more?).  

Data is saved in the data folder. One can change the file name by modifying the `FILE_PREFIX` variable in `scripts/http_bridge.js`  

In the viewer, the data is interpolated (smoothed) before being displayed to make it easier to view. However only the raw 8x8 pixel data is saved. To disable the interpolation in the viewer, change `interpFactor` from 5 to 0 in `src/App.js`. 

The viewer color scale currently ranges between 0 and 30 degrees C. To change, edit the `tempRange` variable in `src/App.js`.  

I may add a way of doing this through the user interface at some point.  


