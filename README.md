# IEEE UNT North Tech-SAS
## Server Setup Steps
### Server:
* Install nginx
	* Set up reverse proxy
	* References:
		* https://www.digitalocean.com/community/tutorials/how-to-install-linux-nginx-mysql-php-lemp-stack-on-ubuntu-20-04
		* https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/
* Install nodejs
	* Write request script
	* Ensure node is updated with nvm to latest version so that discord.js works properly.
		* https://github.com/nvm-sh/nvm
	* References:
		* https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-20-04
* Install pm2
	* Run request script
	* References: 
		* https://www.digitalocean.com/community/tutorials/nodejs-pm2
* Install mongodb
	* Add an administrative user for security
	* Enable authentication
	* References:
		* https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/
		* https://www.digitalocean.com/community/tutorials/how-to-install-mongodb-on-ubuntu-20-04
		* https://www.digitalocean.com/community/tutorials/how-to-secure-mongodb-on-ubuntu-20-04
* Install discord.js
	* Add bot to discord.
	* Get token.
	* Write Node.js script to handle discord bot.
	* References:
		* https://www.digitalocean.com/community/tutorials/how-to-build-a-discord-bot-with-node-js
		* https://discord.js.org/#/docs/main/stable/general/welcome

### Domain Name & DNS
* Register free domain name:
	* Examples: 
		* https://namecheap.com/
		* https://www.freenom.com/ (what I used for ieeeunt.tk)
* Register free DNS routing:
	* Examples:
		* https://www.cloudflare.com/dns (what I used for ieeeunt.tk)
		* https://freedns.afraid.org/
		* https://www.cloudns.net/
		* More: https://www.keycdn.com/blog/best-free-dns-hosting-providers
	* Follow instructions from site to implement routing.

### Create Unique Server Block with Nginx
* Create directory for domain name
	* `sudo mkdir -p /var/www/your_domain/html`
* Assign ownership of directories to user
	* `sudo chown -R $USER:$USER /var/www/your_domain/html`
* Create basic index.html page in this directory for the landing page.
* Add new sites-available document for Nginx: /etc/nginx/sites-available/your_domain
* Add a symlink for the new document for Nginx to read at startup
	* `sudo ln -s /etc/nginx/sites-available/your_domain /etc/nginx/sites-enabled/`
* Uncomment the server_names_hash_bucket_size line in the Nginx config file at /etc/nginx/nginx.conf
* Test nginx and restart
	* `sudo nginx -t`
	* `sudo systemctl restart nginx`
* Navigate to domain to test.

### Requirements for Front-End Requests
* To use xmlHttp requests from front end js, you need to set up Nginx for HTTPS proxy.
* Make sure a domain name and an A DNS record is set up for the server.
* Use the default ngixn server blocks with the server name changed only first. Use certbot to create the SSL certs. Then modify with the server blocks from the repository.
* Follow the Digital Ocean guide to install certbot and create an SSL certificate for the domain with LetsEncrypt
	* Can use certbot to automatically update the Nginx configuration for port 443 (HTTPS) redirection.
	* Also make sure to set your DNS provider (e.g., CloudFlare) to full SSL/TLS encryption. Called "Full (Strict)" on CloudFlare. Otherwise redirections will infinitely loop.
	* Reference: 
		* https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-20-04#step-4-%E2%80%94-obtaining-an-ssl-certificate
		* https://stackoverflow.com/questions/23121800/nginx-redirect-loop-with-ssl/56387228#56387228
* Also need to setup the reverse proxy location block to correctly proxy using SSL
	* Before location block, use `set $upstream localhost:3000;` (change port to one listening in nodejs script)
	* In location block, use
	* Reference:
		* https://medium.com/@mightywomble/how-to-set-up-nginx-reverse-proxy-with-lets-encrypt-8ef3fd6b79e5
	* In location block, use

```
proxy_pass_header Authorization;
proxy_pass http://$upstream;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_http_version 1.1;
proxy_set_header Connection “”;
proxy_buffering off;
client_max_body_size 0;
proxy_read_timeout 36000s;
proxy_redirect off;
```

