SoD_Locator_SS
==============

This is the server for SoD, and it must be running for the other parts to connect to it.
 - SoD Sensor
 - Any iOS client using the SoD API (iPad, iPhone)
 - Any C# client using the SoD API (tabletop, Windows, SurfacePro)

The server is written with Node.js, and uses several modules such as Express and Socket.IO.  

1. Make sure you have Node.js installed: http://nodejs.org/download/  
2. You can use the latest Visual Studio or WebStorm IDE if you'd like, or you can run the project directly from command.  
3. In the prjoect folder, type ```npm install``` This should download/install any missing dependencies.  
4. If running from command, locate the **frontend.js** file and run with: ```node frontend.js```  
5. Once the server is running, the setup/visualizer page can be accessed with ```http://localhost:3000```

To locate your IP address:
If running Windows, open Command Prompt and type ```ipconfig``` You want your IPv4 Address.
If running Mac, open network Preferences. Under the connection status you should see your IP address.

Any device connected to the same gateway should connect. If not, try check your firewall settings. Ex:  
 - 192.168.20.12
 - 192.168.20.17
 - 192.168.20.155
