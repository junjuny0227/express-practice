# 배포 문서

이 문서는 GSM SV VM에 Express 서버를 Docker로 배포하고, GitHub Actions로 자동 배포까지 연결하는 전체 과정을 정리한 문서입니다.

## 1. GSM SV 접속 정보 확인

현재 VM 접속 정보는 다음과 같습니다.

```txt
SSH 계정: ubuntu
SSH 호스트: ssh.gsmsv.site
SSH 포트: 21114
HTTP 외부 주소: http://ssh.gsmsv.site:22114
```

GSM SV 포트포워딩 구조는 다음과 같습니다.

```txt
외부 ssh.gsmsv.site:22114
-> VM 내부 80번 포트
-> Docker Compose 80:3000
-> Express 앱 3000번 포트
```

그래서 `compose.yaml`은 VM 내부 `80`번 포트를 컨테이너의 `3000`번 포트에 연결합니다.

## 2. 서버에 처음 SSH 접속하기

로컬 터미널에서 다음 명령어로 서버에 접속합니다.

```bash
ssh ubuntu@ssh.gsmsv.site -p 21114
```

처음 접속하면 다음과 비슷한 메시지가 뜰 수 있습니다.

```txt
The authenticity of host '[ssh.gsmsv.site]:21114' can't be established.
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

학교 대시보드에 나온 SSH 주소와 포트가 맞다면 `yes`를 입력합니다.

그 다음 VM의 SSH 비밀번호를 입력합니다. 비밀번호는 입력해도 화면에 표시되지 않는 것이 정상입니다.

## 3. 서버 기본 도구 확인

서버에 접속한 뒤 Docker, Docker Compose, Git이 설치되어 있는지 확인합니다.

```bash
docker ps
git --version
docker compose version
```

세 명령어가 모두 에러 없이 실행되면 다음 단계로 넘어갑니다.

만약 Docker가 없다면 Ubuntu 22.04 기준으로 다음 명령어를 실행합니다.

```bash
sudo apt update
sudo apt install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo ${UBUNTU_CODENAME:-$VERSION_CODENAME}) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

`ubuntu` 유저가 `sudo` 없이 Docker를 쓰게 하려면 다음 명령어를 실행합니다.

```bash
sudo usermod -aG docker $USER
```

이후 SSH에서 나갔다가 다시 접속합니다.

```bash
exit
ssh ubuntu@ssh.gsmsv.site -p 21114
```

## 4. 프로젝트를 서버에 clone하기

서버에서 프로젝트를 받을 위치를 정합니다.

이 문서와 GitHub Actions 설정에서는 다음 경로를 기준으로 합니다.

```txt
/home/ubuntu/express-practice
```

서버에서 repo를 clone합니다.

```bash
git clone <GitHub repo 주소> /home/ubuntu/express-practice
cd /home/ubuntu/express-practice
```

현재 디렉터리 경로는 다음 명령어로 확인할 수 있습니다.

```bash
pwd
```

이 값은 나중에 GitHub Actions Secret의 `DEPLOY_PATH`에 사용합니다.

## 5. Docker Compose로 수동 배포하기

서버의 프로젝트 디렉터리에서 다음 명령어를 실행합니다.

```bash
docker compose up -d --build
```

컨테이너가 정상 실행되는지 확인합니다.

```bash
docker ps
```

브라우저에서 다음 주소를 열어 JSON 응답이 보이면 수동 배포 성공입니다.

```txt
http://ssh.gsmsv.site:22114
```

이후 수동으로 다시 배포할 때는 서버에서 다음 명령어를 실행하면 됩니다.

```bash
cd /home/ubuntu/express-practice
git pull
docker compose up -d --build
```

## 6. GitHub Actions용 SSH 키 만들기

GitHub Actions는 사람이 비밀번호를 입력할 수 없으므로 SSH 비밀번호가 아니라 SSH 개인키를 사용해야 합니다.

로컬 컴퓨터에서 배포용 키를 만듭니다.

```bash
ssh-keygen -t ed25519 -f ~/.ssh/express_practice_deploy_github
```

다음 질문이 나오면 그냥 Enter를 눌러 passphrase를 비워둡니다.

```txt
Enter passphrase (empty for no passphrase):
```

GitHub Actions에서 사용할 배포용 키는 passphrase 없이 만드는 것이 가장 단순합니다.

생성되는 파일은 두 개입니다.

```txt
~/.ssh/express_practice_deploy_github      개인키, GitHub Secret에 등록
~/.ssh/express_practice_deploy_github.pub  공개키, 서버 authorized_keys에 등록
```

## 7. 공개키를 서버에 등록하기

로컬에서 공개키를 출력합니다.

```bash
cat ~/.ssh/express_practice_deploy_github.pub
```

출력은 다음과 비슷한 한 줄입니다.

```txt
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA... user@local
```

이 한 줄 전체를 복사합니다.

그 다음 서버에 비밀번호로 접속합니다.

```bash
ssh ubuntu@ssh.gsmsv.site -p 21114
```

서버에서 `authorized_keys` 파일을 엽니다.

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
```

방금 복사한 공개키 한 줄을 붙여넣고 저장합니다.

`nano` 저장 방법:

```txt
Ctrl + O
Enter
Ctrl + X
```

권한을 설정합니다.

```bash
chmod 600 ~/.ssh/authorized_keys
```

서버에서 나옵니다.

```bash
exit
```

## 8. SSH 키 접속 테스트하기

로컬에서 다음 명령어를 실행합니다.

```bash
ssh -i ~/.ssh/express_practice_deploy_github ubuntu@ssh.gsmsv.site -p 21114
```

비밀번호나 passphrase를 묻지 않고 바로 접속되면 성공입니다.

만약 VM 비밀번호를 묻는다면 공개키가 서버에 제대로 등록되지 않은 것입니다.

만약 다음 메시지가 뜬다면 passphrase가 있는 키를 사용 중인 것입니다.

```txt
Enter passphrase for key ...
```

GitHub Actions용 키는 passphrase 없이 새로 만드는 것을 추천합니다.

## 9. GitHub Secrets 등록하기

GitHub repo에서 다음 메뉴로 이동합니다.

```txt
Settings
-> Secrets and variables
-> Actions
-> Repository secrets
```

다음 Secret을 등록합니다.

```txt
SSH_PRIVATE_KEY
DEPLOY_PATH
```

`SSH_PRIVATE_KEY`에는 로컬의 개인키 내용을 넣습니다.

```bash
cat ~/.ssh/express_practice_deploy_github
```

출력 전체를 그대로 복사해서 넣습니다.

반드시 아래 줄을 모두 포함해야 합니다.

```txt
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

주의할 점:

- `.pub` 파일 내용이 아니라 개인키 파일 내용을 넣어야 합니다.
- `-----BEGIN OPENSSH PRIVATE KEY-----`를 포함해야 합니다.
- `-----END OPENSSH PRIVATE KEY-----`를 포함해야 합니다.
- 줄바꿈을 유지해야 합니다.
- 이 값은 repo 파일이나 `.env`에 넣으면 안 됩니다.

`DEPLOY_PATH`에는 서버의 프로젝트 경로를 넣습니다.

```txt
/home/ubuntu/express-practice
```

현재 워크플로에는 다음 값이 이미 들어 있습니다.

```txt
SSH_HOST=ssh.gsmsv.site
SSH_PORT=21114
SSH_USERNAME=ubuntu
```

## 10. GitHub Actions로 자동 배포하기

현재 `.github/workflows/deploy.yml`은 `main` 브랜치에 push되면 자동 실행됩니다.

동작 순서는 다음과 같습니다.

```txt
main 브랜치에 push
-> GitHub Actions 실행
-> SSH 키로 GSM SV 서버 접속
-> DEPLOY_PATH로 이동
-> git pull
-> docker compose up -d --build
-> 오래된 Docker 이미지 정리
```

수동으로 실행하고 싶으면 GitHub Actions 화면에서 `Deploy` 워크플로를 선택한 뒤 `Run workflow`를 누릅니다.

## 11. 자주 만난 오류

### Permission denied (publickey,password)

GitHub Actions 로그에 다음 오류가 뜨는 경우입니다.

```txt
Permission denied (publickey,password)
```

의미:

```txt
서버에는 도달했지만 SSH 키 인증에 실패했다.
```

확인할 것:

- GitHub Secret `SSH_PRIVATE_KEY`에 개인키를 넣었는지 확인
- `.pub` 공개키를 넣은 것이 아닌지 확인
- 서버의 `~/.ssh/authorized_keys`에 공개키가 들어 있는지 확인
- 로컬에서 키 접속이 되는지 확인

```bash
ssh -i ~/.ssh/express_practice_deploy_github ubuntu@ssh.gsmsv.site -p 21114
```

이 명령이 비밀번호 없이 접속되어야 GitHub Actions도 성공할 수 있습니다.

### Pseudo-terminal will not be allocated

GitHub Actions 로그에 다음 메시지가 보일 수 있습니다.

```txt
Pseudo-terminal will not be allocated because stdin is not a terminal.
```

이 메시지는 GitHub Actions처럼 비대화형 환경에서 SSH를 실행할 때 흔히 나오는 안내입니다.

보통 문제의 핵심은 이 메시지가 아니라 뒤에 나오는 `Permission denied` 같은 인증 오류입니다.

### Enter passphrase for key

로컬에서 키 접속 테스트 중 다음 메시지가 뜨는 경우입니다.

```txt
Enter passphrase for key ...
```

키를 만들 때 passphrase를 설정한 것입니다.

로컬 접속에는 사용할 수 있지만 GitHub Actions 자동 배포에는 불편합니다. 배포용 키는 passphrase 없이 새로 만드는 것을 추천합니다.
