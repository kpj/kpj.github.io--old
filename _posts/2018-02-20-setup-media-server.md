---
layout: post
title:  "Setup a media-server"
categories: ["tutorial", "linux"]
---


Intro
-----

In this tutorial, we assume that a hard-drive containing various types of media is mounted on some server.
Its content will then be made accessible via `NFS`, streamed to e.g. your TV using `DLNA`, while being continuously monitored with `munin`.


Setting up DLNA
---------------

DLNA is short for 'Digital Living Network Alliance' and allows media access from various types of rendering devices, most notably Smart TVs.

Its setup is fairly easy.
Firstly, install a DLNA server on the device hosting the media data:
{% highlight bash %}
$ pacman -S minidlna
{% endhighlight %}

Then configure it by editing `/etc/minidlna.conf` and adjusting the following values:
{% highlight bash %}
media_dir=/HD/media
friendly_name=kpj's friendly DLNA server
{% endhighlight %}

Finally, just start/enable it:
{% highlight bash %}
$ systemctl enable --now minidlna.service
{% endhighlight %}

It will now appear as a DLNA source on your respective rendering device.

Due to "some" reason, DLNA does sometimes not synchronize new files (even after restarts).
In order to fix this, simply delete `/var/cache/minidlna/files.db` and restart again.


Setting up NFS
--------------

NFS (Network File System) will allow you add new data to the media storage via a network connection.
Install the needed applications:
{% highlight bash %}
$ pacman -S nfs-utils
{% endhighlight %}

Furthermore, it's a good idea to enable time-synchronization:
{% highlight bash %}
$ systemctl enable --now systemd-timesyncd
{% endhighlight %}

### Server

The server is the device which has a physical (direct) connection to the hard-drive, which is assumed to be mounted in `/mnt/media/`.

It is good practice to store all tentative NFS shares in a joint root (here: `/srv/nfs/`):
{% highlight bash %}
$ mkdir -p /srv/nfs/media
$ mount --bind /mnt/media/ /srv/nfs/media/
{% endhighlight %}

In order to make this persistent across reboots, add the following line to `/etc/fstab`:
{% highlight bash %}
/mnt/media /srv/nfs/media/  none   bind   0   0
{% endhighlight %}

To publish a shared directory, its configuration needs to be appended to `/etc/exports`:
{% highlight bash %}
/srv/nfs/media     192.168.1.0/24(rw,sync,crossmnt,fsid=0,no_subtree_check)
{% endhighlight %}


If NFS was already running, we need to notify it of our changes:
{% highlight bash %}
$ exportfs -rav
{% endhighlight %}

Otherwise, simply start the NFS service:
{% highlight bash %}
$ systemctl enable --now nfs-server.service
{% endhighlight %}

In the end, list all exports to make sure everything worked out:
{% highlight bash %}
$ exportfs -v
{% endhighlight %}


### Client

Assuming that the server is reachable using its ip, setting up the client is fairly straight-forward.

First, make sure that the exports are available:
{% highlight bash %}
$ showmount -e <server ip>
{% endhighlight %}

And then mount them accordingly:
{% highlight bash %}
$ mount -t nfs <server ip>:/srv/nfs/media /mnt/HD/media/
{% endhighlight %}


Monitoring server health
---------------------

We will monitor and display the server's health status using `munin`.
First, we'll focus on its general setup and subsequently on various useful plugins.


### Munin-Master setup

The master will gather data from all nodes and render them using HTML.

Install `munin`:
{% highlight bash %}
$ pacman -S munin
{% endhighlight %}

Then, instruct it to store HTML renders of the health-reports in `/srv/http/munin`. This will make them easily accessible using a webserver later on.
First, prepare the directory:
{% highlight bash %}
$ mkdir -p /srv/http/munin
$ chown munin:munin /srv/http/munin
{% endhighlight %}

And then edit `/etc/munin/munin.conf`:
{% highlight bash %}
htmldir /srv/http/munin
{% endhighlight %}

In order to generate graphs every 5 minutes, we will create a systemd-service which is going to be called from a systemd-timer.

The service (`/etc/systemd/system/munin-cron.service`) itself will call `munin-cron` and looks as follows:
{% highlight bash %}
[Unit]
Description=Survey monitored computers
After=network.target

[Service]
User=munin
ExecStart=/usr/bin/munin-cron
{% endhighlight %}

The timer `/etc/systemd/system/munin-cron.timer` is then:
{% highlight bash %}
[Unit]
Description=Survey monitored computers every five minutes

[Timer]
OnCalendar=*-*-* *:00/5:00

[Install]
WantedBy=multi-user.target
{% endhighlight %}

Before enabling them, we can try a manual test-run by running `munin-cron` as the munin user (remember that nothing will happen without enabling some plugins):
{% highlight bash %}
$ su - munin --shell=/bin/bash -c munin-cron
{% endhighlight %}

If we are sure that everything works, we can finally enable the timer:
{% highlight bash %}
$ systemctl daemon-reload
$ systemctl enable --now munin-cron.timer
{% endhighlight %}

And afterwards -- of course -- check the logs:
{% highlight bash %}
$ journalctl --unit munin-cron.service
{% endhighlight %}

#### Making the results available

To make the results accessible using a web-browser, we use `lighttpd`.
This will automatically serve `/srv/http/` on port 80 (make sure to checkout `/etc/lighttpd/lighttpd.conf`):
{% highlight bash %}
$ pacman -S lighttpd
$ systemctl start lighttpd
{% endhighlight %}

The reports can then be accessed under `<server ip>/munin/`.


### Munin-Node setup

Each device for which health-summaries shall be reported needs to become a `munin-node` (this is also the case for the master).
Luckily, this is rather trivial:
{% highlight bash %}
$ pacman -S munin-node
{% endhighlight %}

On the node itself, we need to allow communication with the master (in `/etc/munin/munin-node.conf`):
{% highlight bash %}
host_name <my name>
allow ^<master ip>$
{% endhighlight %}

and start the node (don't forget to add plugins though):
{% highlight bash %}
$ systemctl enable --now munin-node
{% endhighlight %}

On the master-server, we have to add a configuration entry per node to `/etc/munin/munin.conf`:
{% highlight bash %}
[group_name;master-node]
    address 127.0.0.1

[group_name;machine01]
    address <node ip>
{% endhighlight %}


### Plugins

Without plugins, `munin` won't be reporting much.
In the following, a few useful ones will be listed. More plugins can be found, e.g. by calling `munin-node-configure --suggest`.

Each plugin can be installed by first copying them to `/usr/lib/munin/plugins/` and then linking with `/etc/munin/plugins/`.
Note that they must be executable (`chmod a+x /usr/lib/munin/plugins/<plugin name>`):
{% highlight bash %}
$ ln -s /usr/lib/munin/plugins/<plugin name> /etc/munin/plugins/
{% endhighlight %}

As a general rule, each individual plugin can be tested in isolation using the following command:
{% highlight bash %}
$ munin-run <command name>
{% endhighlight %}
For the CPU-plugin `<command name>` would be `cpu`.

Remember, that a node needs to be restarted after changing its plugin configuration:
{% highlight bash %}
$ systemctl restart munin-node
{% endhighlight %}

#### Common plugins

The following are plugins providing generally useful statistics:
* `cpu`: CPU-speed
* `df`: disk space usage
* `diskstats`: various disk stats

#### SMART-plugin

`S.M.A.R.T.` provides a nice way of monitoring your disks (HDD, SSD, etc) health status.

Its basic usage if fairly straight-forward:
{% highlight bash %}
$ pacman -S smartmontools
$ smartctl -i /dev/sda  # show device info
$ smartctl -t short /dev/sda  # run a short test
$ smartctl -H /dev/sda  # show test results
{% endhighlight %}

To interlink it with `munin`, first configure the plugin by writing the following to `/etc/munin/plugin-conf.d/munin-node`:
{% highlight bash %}
[smart_*]
    user root
    group disk
{% endhighlight %}

and secondly enable it:
{% highlight bash %}
$ ln -s /usr/lib/munin/plugins/smart_ /etc/munin/plugins/smart_sda  # for disk /dev/sda
{% endhighlight %}


#### lm_sensors-plugin

`lm_sensors` allow the tracking of temperatures, voltages and more.

First, set them up as you normally would:
{% highlight bash %}
$ pacman -S lm_sensors
$ sensors-detect  # generate kernel-modules (always press enter)
$ sensors
{% endhighlight %}

Temperatures can then be monitored by adding the respective plugin:
{% highlight bash %}
$ ln -s /usr/lib/munin/plugins/sensors_ /etc/munin/plugins/sensors_temp
{% endhighlight %}


### Troubleshooting

#### General tips
A manual connection to a node is possible, and useful for debugging:
{% highlight bash %}
$ netcat <node ip> 4949
{% endhighlight %}
One can then enter e.g. one of the following commands:
* `list`: list enabled plugins
* `fetch <plugin name>`: check output of given plugin

Furthermore, `munin-cron` can be run with the `--debug` option to show what is going on in more detail.

More information can be found [here](http://guide.munin-monitoring.org/en/latest/tutorial/troubleshooting.html).

#### Corrupted database
The munin-databases can be found in `/var/lib/munin/<group name>`. Delete them to reset all data.

#### Certain nodes cannot be reached.
Check that their ip-address is set correctly in the master's `/etc/munin/munin.conf`.
Furthermore make sure that their own configuration (`/etc/munin/munin-node.conf`) allows the master to connect (`allow <master ip>`).
