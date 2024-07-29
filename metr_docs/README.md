## Requirements

This document is being written on an Ubuntu 22.04 desktop, so the instructions may need some adjustment on other distributions (etc).

Ubuntu 22.04 uses Python 3.10, so that's the version of Python we'll be using (where it's needed).

### Windows WSL2

These instructions [have been reported to work](https://github.com/getredash/redash/issues/6151#issuecomment-1625661618) without any changes on Windows WSL2.

# Set up the prerequisites

## Install needed packages

```
$ sudo apt -y install docker.io docker-buildx docker-compose-v2
## NOTE: You may need to remove the corresponding docker plugins first if the above command fails
$ sudo apt -y install build-essential curl docker-compose pwgen python3-venv xvfb
```

## Add your user to the "docker" group

```
$ sudo usermod -aG docker $USER
```

## Install Node Version Manager

```
$ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
## You may need to save as a script file first, then change she-bang to point to correct shell
```

Now log out of your desktop, then back in again, for the group change to become effective and nvm to be available

## Install NodeJS version 18

```
$ nvm install --lts 18
$ nvm alias default 18
$ nvm use 18
```

Confirm version 18 of NodeJS is active:

```
$ nvm list
```

## Install Yarn 1.x

```
$ npm install -g yarn@1.22.22
```

## Clone the Redash source code and install the NodeJS dependencies

```
$ git clone git@github.com:metr-systems/redash.git
$ cd redash
$ yarn
```

Note: if you are using mac, and yarn cannot succeed because of puppeteer, consider [this solution](https://www.broddin.be/fixing-the-chromium-binary-is-not-available-for-arm64/), it should work

# Compile and build

Redash uses [GNU Make](https://www.gnu.org/software/make/) to run things, so if you're not sure about something it's often a good idea to take a look over the [Makefile](https://github.com/getredash/redash/blob/master/Makefile) which can help. :smile:

## Build the Redash front end

```
$ make build
```

## Build local Redash Docker image

```
$ make compose_build
```

On my desktop (Ryzen 5600X) that took about 12 minutes to complete the first
time. After that though, it's much faster at about a minute and a half each time.

It's a good idea to check that the docker images were built ok. We do that by
telling docker to show us the local "docker images", which should include
these three new ones. It's important the "created" time shows them to be
very recent... if it's not, then they're old images left over from something
else. :wink:

```
$ docker image list
REPOSITORY         TAG       IMAGE ID       CREATED         SIZE
redash_scheduler   latest    85bc2dc57801   2 minutes ago   1.38GB
redash_server      latest    85bc2dc57801   2 minutes ago   1.38GB
redash_worker      latest    85bc2dc57801   2 minutes ago   1.38GB
```

# Start Redash locally, using the docker images you just built

```
$ make create_database
$ make up
```

The `docker compose ps` command should show all of the docker pieces
are running:

```
$ docker compose ps
       Name                     Command                  State                                  Ports
---------------------------------------------------------------------------------------------------------------------------------
redash_email_1       bin/maildev                      Up (healthy)   1025/tcp, 1080/tcp, 0.0.0.0:1080->80/tcp,:::1080->80/tcp
redash_postgres_1    docker-entrypoint.sh postg ...   Up             0.0.0.0:15432->5432/tcp,:::15432->5432/tcp
redash_redis_1       docker-entrypoint.sh redis ...   Up             6379/tcp
redash_scheduler_1   /app/bin/docker-entrypoint ...   Up             5000/tcp
redash_server_1      /app/bin/docker-entrypoint ...   Up             0.0.0.0:5001->5000/tcp,:::5001->5000/tcp,
                                                                     0.0.0.0:5678->5678/tcp,:::5678->5678/tcp
redash_worker_1      /app/bin/docker-entrypoint ...   Up             5000/tcp
```

The Redash web interface should also be available at http://localhost:5001, ready to be configured:

![image](https://github.com/getredash/redash/assets/406299/9c64fab5-9188-44a1-ab4c-62c19833d9cd)

Once you've finished confirming everything works the way you want, then shut down the containers with:

```
$ make down
```

# Set up Python for local backend development

Install the Ubuntu packages needed by various data sources:

```
$ sudo apt install -y --no-install-recommends default-libmysqlclient-dev freetds-dev libffi-dev libpq-dev \
    python3-dev libsasl2-dev libsasl2-modules-gssapi-mit libssl-dev unixodbc-dev xmlsec1
```

If you are on mac, you may probably use brew

```
brew install mysql-client freetds libffi libpq python3-dev cyrus-sasl openssl unixodbc libxmlsec1
```

Then create a Python virtual environment, for safely installing Python libraries without affecting Python on the rest of the system:

```

$ python3 -m venv ~/redashvenv1
$ source ~/redashvenv1/bin/activate

```

When the Python virtual environment is active in your session, it changes the prompt to look like this:

```

(redashvenv1) $

```

With that done, install the rest of the Python dependencies:

```

(redashvenv1) $ pip3 install wheel  # "wheel" needs to be installed by itself first
(redashvenv1) $ pip3 install --upgrade black ruff launchpadlib pip setuptools
(redashvenv1) $ pip3 install poetry
(redashvenv1) $ poetry install --only main,all_ds,dev

```

# Configuring Pre-commit

Before committing changes to GitHub or creating a pull request, the source code needs to be checked and formatted for certain quality standards:

```

(redashvenv1)$ make format
pre-commit run --all-files
isort....................................................................Passed
black....................................................................Passed
flake8...................................................................Passed

```

Enabling Pre-commit check before commit.

```

(redashvenv1) $ pre-commit install
(redashvenv1) $ git commit -m 'Added xxx'

```

# Next step: [Testing](https://github.com/getredash/redash/wiki/Testing-your-changes)

for installing cypress on mac

```
brew install gtk+ openlibm libnotify nss libx11 libsoundio libxtst xauth
```

and then run the tests with

```
yarn cypress build
yarn cypress all
```
