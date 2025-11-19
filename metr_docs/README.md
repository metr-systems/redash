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
brew install mysql-client@8.0 freetds libffi libpq python3-dev cyrus-sasl openssl unixodbc libxmlsec1
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
(redashvenv1) $ poetry install --with dev
# If you need to have the data sources dependencies locally, also install them with
(redashvenv1) $ poetry install --only all_ds

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

# Running both backend and frontend locally without docker

- make sure redis is running by executing command `redis-server` on terminal
- make sure to copy .env-example tp `.env` and fill the values for for `REDASH_COOKIE_SECRET` and `REDASH_SECRET_KEY` and `DATABASE_URL`
- create a local db for redash and run `./manage.py database create_tables`
- make sure that your `REDASH_DATABASE_URL` / `SQLALCHEMY_DATABASE_URI` is updated with the newly created db
- start the scheduler and the worker with `./manage.py rq scheduler` and `./manage.py rq worker`
- run the server from inside redash dir with the command `flask run --host=127.0.0.1 --port=5001`
- run the frontend using `REDASH_BACKEND="http://127.0.0.1:5001" yarn start` (you should have run `yarn build` before)
- It should tells you where your frontend is running in my case, it was on http://localhost:8080, accessing this url for first time you should be redirected to the setup page like this

# Migrations:

When you create the local db the first time you need to create the tables:

- `create_all()` is used to create the tables for a new database, it is ran in this project via `./manage.py database create_tables`

# Next step: [Testing](https://github.com/getredash/redash/wiki/Testing-your-changes)

- command to test backend is `pytest`
- command to test frontend is `yarn test`
- command to run one frontend test named "testName" is `yarn jest -t "testName"`
  checking your installed dependencies for any failing tests

- for installing cypress on mac

```
brew install gtk+ openlibm libnotify nss libx11 libsoundio libxtst xauth
```

and then run the tests with

```
yarn cypress build
yarn cypress all
```

# Other Essential commands to know

## Managing migrations

To manage migration, use flask-migrate commands

- To create a new migration after you changed the models , you can run `flask db migrate -m "message"`.
- Use `flask db upgrade` to migrate you database, so that it includes the new changes.
- For any additional command to manage migrations, you can check the help with `flask db --help`

## Managing translations

For backend, everytime you change or add a new translation, you need first to extract it,
update the translation files, and manually set the translations in these files,
then you need to compile the translation to see them working

- `pybabel extract -F redash/babel.cfg -o redash/locales/messages.pot .`
- `pybabel update -i redash/locales/messages.pot -d redash/translations`
- `pybabel compile -d redash/translations`

For frontend, you simply just need to parse and manually update the translation files.
Please do not leave english texts with empty values otherwise our config would select german for it.

- `npx i18next-parser --config i18next-parser.config.js`

## Accessing flask shell

To access the Flask shell, follow these steps:

- Enter the container `kubectl exec -n staging -ti pod/dashboards-xxxxxxxx -- /bin/bash`
- Launch the Flask shell `FLASK_APP=/app/redash/app.py flask shell`
- Execute your commands: You can now run any necessary commands within the Flask shell. For example, to delete a user, you can use the following Python code:

```python
from redash import models
user = models.User.query.filter_by(email="name@gmail.com").first()

from redash.models import db
db.session.delete(user)
db.session.commit()
```

## Updating redash with upstream 

**Strategy:** Create branch from main → Merge upstream into it → Merge back to main.

### Phase 1: Preparation

**Goal:** Get the latest code and create the merging branch.

```bash
# 1. Fetch the latest tags from the official Redash repo (upstream)
git fetch upstream --tags

# 2. Switch to main branch and ensure it is up to date
git checkout metr-main
git pull origin metr-main

# 3. Create the merge branch FROM metr-main
git checkout -b merge-v25.8.0
```

### Phase 2: The Merge

**Goal:** Pull the new Redash code (v25.8.0) into your branch.

```bash
# 1. Merge the official release tag into your current branch
git merge v25.8.0
```

**⚠️ Check the Output**

- **If it says "Fast-forward":** You are done with this phase.

- **If it says "CONFLICT":**
  1. Open the files listed in red.
  2. Look for `<<<<<<< HEAD` (Your code) and `>>>>>>> v25.8.0` (New Redash code).
  3. Resolve the conflict (usually keeping the new Redash code but reapplying your specific config/changes).
  4. Stage and commit:
     ```bash
     git add <file>
     git commit  # Accept the default merge message
     ```

### Phase 3: Verification

**Goal:** Ensure the application works before pushing.


  1. If poetry dependencies have been changed, you will need to refresh the content-hash by executing : 
```bash
poetry lock --no-update 
```

Note that you can check if poetry is okay by executing 
```bash
poetry check --lock
```

Make sure to install if needed
```bash
poetry install
```

  2. If there were some new or updated yarn dependencies you will need to do 
```bash
yarn install
```
Your yarn lock will be updated according to the package.json file updates

 3. Check that there is no db migrations conflict

```bash
flask db heads
```
If conflicting heads (more than one head)

```bash
flask db merge -m "merge conflicting heads"
flask db upgrade
```

Don’t forget to check files formatting with 

```bash
yarn prettier
pre-commit run --all-files
```

 4. Go to the Test step in this readme and check that tests are running

### Phase 4: Update metr-main

**Goal:** Update metr-main

Either ppen PR about merge branch and merge it into metr-main after review
Or do it with commands directly with the following:

```bash
# 1. Switch back to your main branch
git checkout metr-main

# 2. Merge your working branch back into main
# (This will be a clean fast-forward)
git merge merge-v25.8.0
```

### Phase 5: Finalize & Deploy

**Goal:** Push to the server/Deploy.

# 1. Create and Push the main branch with the Deployment Tag

```bash
git tag v25.8.0-metr-r1
git push origin meta-main —tags
```
# 2. Cleanup (Delete the working branch)

```bash
git branch -d merge-v25.8.0
```
