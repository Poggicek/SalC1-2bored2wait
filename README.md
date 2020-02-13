# 2bored2wait SalC1 Edition
A proxy to wait out SalC1's queue.

## This is edition version of original 2b2w to work with SalC1's anarchy server. https://github.com/themoonisacheese/2bored2wait by themoonisacheese
This Readme file was copied from original 2b2w, these steps are exactly the same as before.

# How to install
1. Download node.js and install it. On non-windows platforms, you also need npm.
2. Download this repository with the green button (top right of this page). If you downloaded it as zip, unzip it.
3. Open a terminal and navigate to the folder you downloaded it
4. Run `npm install`
5. Open secrets.json Fill out your minecraft information in the file. Note that you must use your email adress and not your minecraft username.
6. If you so wish, edit the configuration in config.json. (On Linux ports below 1024, including port 80, require you to run the program with administrator rights.)
7. For trust reasons, this tool does not update automatically. Check back here once in a while to see if there are any updates.

# How to use
1. read the code to ensure i'm not stealing your credentials. i'm not, but you shouldn't take my word for it. If you don't know how to read it, downloading stuff off the internet and giving it your password is probably a bad idea anyway.
4. run `npm start`
5. a browser window should open. You can close it if you want at any moment, and you can access it again at adress http://localhost
6. press the "Start queing" button. The queue position indicator auto-updates, but sometimes it takes a while to start counting (like 1 min).
7. once the queue reaches a low number, connect to the minecraft server at address `localhost`. Currently, you have to connect BEFORE reaching the end of the queue or you will not spawn in the world correctly (I'm told that sneaking around and right-clicking things eventually makes you spawn correctly but I was not able to verify that).
8. after you log off, click the "stop queuing" button. This is really important, as you will not actually disconnect from 2b2t until you do that.

# Video guide
Here's a video guide on how to install and use 2b2w: https://www.youtube.com/watch?v=oWeCmZNYAW4, same process for SalC1 edition 

# Known issues
- starting the queue will revoke your minecraft token. this means that you will not be able to join normal minecraft servers until you restart the game
- starting the queue too many times in a row can sometimes boot you out of your minecraft account (starting the queue or connecting in the minecraft client will tell you "wrong email or password"). to fix this, log in to your account at minecraft.net, then restart minecraft. both of these issues are limitations put in place by mojang to prevent account stealing, and are not fixable.
- Some people report not being able to ride animals using this proxy.
