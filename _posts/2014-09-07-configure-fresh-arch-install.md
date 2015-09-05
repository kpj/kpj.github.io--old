---
layout: post
title:  "Configure fresh Arch Install"
categories: ["tutorial", "linux"]
---

Intro
-----

This entry will provide you with the first few steps needed to get a fresh Arch install running and happy.


Setting up a Network Connection
-------------------------------
In order to install all missing programs on-the-fly, a working internet connection is important.

Assuming that you are connected via ethernet, you can copy `/etc/netctl/examples/ethernet-dhcp` to `/etc/netctl/ether` and execute

{% highlight bash %}
$ netctl start ether
{% endhighlight %}

If you want this connection to start on every boot, execute

{% highlight bash %}
$ netctl enable ether
{% endhighlight %}


"Essential" Programs
------------------
In order to complete the following steps, some additional programs might be needed. In order to install those and other cool ones, update the pacman database (`pacman -Syy`) and install the following applications:

* `vim-minimal` - text editing and much more
* `yaourt` - easy installation of AUR packages
* `mplayer`/`mpv` - multimedia player
* `htop` - resource usage stats
* `wget` - network downloader
* `bash-completion` - guess what
* `evince-gtk` - pdf viewer
* `feh` - image viewer
* `scrot` - screenshot application
* `downgrade` - downgrad packages
* `pkgfile` - find out which package a program is in
* `strace` - trace system calls and signals
* `gdb` - GNU debugger
* `mtr` - ping + traceroute
* `ncdu` - `du` with curses interface

* `pacgraph` - see which packages are installed and more


Initial Configuration
---------------------
This section will list a few common first steps after installing the basic system

### Set a Hostname
{% highlight bash %}
$ hostnamectl set-hostname <hostname>
{% endhighlight %}


### Set your Timezone
{% highlight bash %}
$ timedatectl set-timezone Europe/Berlin
{% endhighlight %}

### Set locale
{% highlight bash %}
$ vim /etc/locale.gen # uncomment: "en_US.UTF-8 UTF-8"
$ locale-gen
$ locale -a # list available types
$ vim .config/locale.conf # export entries from `locale` as env vars
{% endhighlight %}

### Handle keyboard layout (console)
Adjust your keyboard layout according to your needs.
{% highlight bash %}
$ localectl status # show current configuration
$ localectl list-keymaps # list available layouts
$ loadkeys de-latin1 # temporarily load layout
$ vim /etc/vconsole.conf # add "KEYMAP=de-latin1" for permanent layout
{% endhighlight %}

### Handle keyboard layout (Xorg)
It might be necessary to adjust X to the layout of your specific keyboard. For german ones, something like the following could be used.
{% highlight bash %}
$ vim ~/.xinitrc # add "setxkbmap de nodeadkeys &" at bottom
{% endhighlight %}

### Set root Password
{% highlight bash %}
$ su
$ passwd
{% endhighlight %}

### Add a Default User
{% highlight bash %}
$ useradd -m -g users -G wheel -s /bin/bash kpj
$ passwd kpj
[..]
{% endhighlight %}


Setting up the GUI
------------------
In order to have a fancy window manager, we have to install X and a driver first (the exact packages required depend on your particular GPU setup)

{% highlight bash %}
$ pacman -S xorg-server xorg-server-utils xorg-xinit
$ pacman -S xf86-video-vesa # xf86-video-intel, lib32-intel-dri    // maybe all in mesa now?
{% endhighlight %}

To then automatically start X on login, add

{% highlight bash %}
[[ -z $DISPLAY && $XDG_VTNR -eq 1 ]] && exec startx
{% endhighlight %}

to the bottom of your `~/.bash_profile`.

In order to automatically login after booting, simply create the file `/etc/systemd/system/getty@tty1.service.d/autologin.conf` (assuming you're using systemd) and paste the following content

{% highlight bash %}
[Service]
ExecStart=
ExecStart=-/usr/bin/agetty --autologin <username> --noclear %I 38400 linux
Type=simple
{% endhighlight %}

Afterwards, e.g. `i3` can then be easily installed and set to automatically start on boot

{% highlight bash %}
$ pacman -S i3
$ cp /etc/skel/.xinitrc ~
$ vim ~/.xinitrc # add "exec i3" at bottom
{% endhighlight %}

`i3` needs the following packages to work correctly

* `dmenu`
* `rxvt-unicode`


Enabling Sound
--------------
Start setting up `pulseaudio` by installing it

{% highlight bash %}
$ pacman -S pulseaudio
{% endhighlight %}

It should now automatically start on boot. Otherwise add this to your `.xinitrc`

{% highlight bash %}
pulseaudio -D &
{% endhighlight %}


Clock Synchronization
---------------------
We haven't used `systemd` so far, so let's do it (Ba Dum Tss!)

{% highlight bash %}
$ systemctl enable systemd-networkd
$ systemctl enable systemd-timesyncd
{% endhighlight %}


Using SSH
---------
{% highlight bash %}
$ pacman -S openssh
$ ssh-keygen
$ systemctl enable sshd.service
{% endhighlight %}


Handle sudo
-----------
{% highlight bash %}
$ pacman -S sudo
$ EDITOR=vim visudo # -> %sudo   ALL=(ALL) ALL
$ groupadd sudo
$ usermod -a -G sudo <user>
{% endhighlight %}


Init vim
--------
Install [this](https://github.com/gmarik/Vundle.vim) plugin manager and look [here](https://github.com/kpj/dotfiles/blob/master/vimrc) for an exemplary configuration file.


Useful `.bashrc` edits
-------
Colorful prompt for normal user:

{% highlight bash %}
PS1='\[\e[1;32m\][\u@\h \W]$\[\e[0m\] '
{% endhighlight %}

for root (same color but as background):

{% highlight bash %}
PS1='\[\e[1;32m\e[7m\][\u@\h \W]$\[\e[0m\] '
{% endhighlight %}


Weechat usage
-------

{% highlight bash %}
$ pacman -S weechat
$ weechat
-> /server add freenode chat.freenode.net
-> /set irc.server.freenode.autoconnect on
-> /set irc.server.freenode.autojoin "#channel1,#channel2"
-> /set irc.server.freenode.nicks "kpj"
-> /set irc.server.freenode.command "/msg nickserv identify <password>"
-> /save
{% endhighlight %}
