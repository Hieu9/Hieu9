FROM ubuntu:18.04
LABEL maintainer="nnhoang@cmc.com.vn"
LABEL app="vnp-gw"

# pre-add ssh key
RUN mkdir -p /root/.ssh
RUN mkdir -p /var/log

ENV TZ=Asia/Saigon
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# install php and php extension
RUN apt-get -y update
RUN apt-get -y upgrade
RUN apt-get install -y bash \
    git \
    curl \
    openssl \
    composer \
    tmux \
    gnupg

RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update -y && apt-get install yarn -y

# install nodejs
RUN apt-get install -y software-properties-common \
&& curl -sL https://deb.nodesource.com/setup_11.x | bash -
RUN apt-get install -y nodejs

RUN npm i -g forever --save
RUN npm i -g nodemon --save
RUN npm i -g pm2 --save  


COPY . /var/server
WORKDIR /var/server
RUN yarn install

EXPOSE 22 9001
# ENTRYPOINT ["bash -c"]
CMD bash -c "yarn start && while :; do sleep 2073600; done"