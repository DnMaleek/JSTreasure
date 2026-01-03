New files added are: 
    -buld_mini_server.js
        This is a small self funning server that enable you to add users in a batch form, i mean many at once.
    -clients.json
        This is the json file with over 100 dammy clients details that makes creation of cliets easy and less frustrating while testing , as you get many data to do so.
            -HOW TO USE IT
                1. Run the buld_mini_server.js (node bulk_mini_server.js)
                2. Go to Postman and the visit the link
                    "http://localhost:5050/import-clients"
                3. On Postman visit the body and select json input type. Then   back to your clients.json file and copy the list and paste it there. Make sure method selected is POST.
                4. Done!
        
Now you will have over 100 clients imported to you system.

New features added: 
    -Search feature
    -Delete popups
    -Seccess popup
    -Pagenation on the view_clients.html file
    
