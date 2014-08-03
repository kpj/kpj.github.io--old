---
layout: post
title:  "Transfer Music to Android Phone"
---

When MTP doesn't work
---------------------
Many websites recommend the use of an MTP based connection in order to transfer music to your android phone. In my experience MTP seems to be quite buggy and unreliable so I decided to use a different approach.

Since 1995 ssh is used all over the world and will serve as the file transfer medium in this case as well (assuming that your computer and phone are in the same network).


SSH on your phone
-----------------
There are many applications which allow you to use ssh on your phone. The one I used was [SSHDroid](https://play.google.com/store/apps/details?id=berserker.android.apps.sshdroid).
After downloading and installing it, it's always a good idea to change the default admin password in the options menu.

Connecting to your phone
------------------------
I found sshfs to be the easiest way to store the music on my phone.
In order to mount the phone, check the ip and port used by the ssh client of your choice (it's on the main screen of SSHDroid) and mount it using the following command

{% highlight bash %}
$ sshfs root@<ip>:/ -p <port> <mount point>
{% endhighlight %}

Transferring music
-----------------
In theory your music app should be able to play music from anywhere on your device. However, I'd recommend to put it on your external storage device (if available).
I normally put my music into `<mount point>/storage/emulated/0/Music`.
You can then do the following in order to load the music onto your device

{% highlight bash %}
$ cd <mount point>/storage/emulated/0/Music
$ cp -rv <path to music>/* .
{% endhighlight %}

Don't forget that you music app might have to rescan your device and start listening to the newly added music.