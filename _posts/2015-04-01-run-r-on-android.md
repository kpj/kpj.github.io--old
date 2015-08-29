---
layout: post
title:  "Run R on Android"
categories: ["tutorial", "android"]
---

Setting up Linux
----------------
An easy way of running some linux distribution on android is using [GNURoot](https://play.google.com/store/apps/details?id=champion.gnuroot) with the [wheezy](https://play.google.com/store/apps/details?id=champion.gnuroot.wheezy) distro. Make sure to launch the rootfs as fake root.

GNURoot allows access to special keys via the `volume up`/`volume down` buttons of your phone and some character on the virtual keyboard:

* `ctrl`+`c`: `volume down`+`c`
* `escape`: `volume up`+`e`
* `tab`: `volume up`+`t`
* `arrow` keys: `volume up`+`w`/`a`/`s`/`d`.


Installing R
------------
In order to make adding repositories easier via the `add-apt-repository` command, execute the following

{% highlight bash %}
$ apt-get install python-software-properties
{% endhighlight %}

Then add a repository which hosts the wanted R package (e.g. the 'rstudio' one)

{% highlight bash %}
$ add-apt-repository "deb http://rstudio.com/bin/linux/debian wheezy-cran3/"
$ apt-key adv --keyserver pgp.mit.edu --recv-keys 381BA480
$ apt-get update
{% endhighlight %}

Finally, install R itself

{% highlight bash %}
$ apt-get install r-base r-base-dev
{% endhighlight %}


Plotting in the Terminal
---------------------------
Plots to stdout can be done by using the [txtplot](http://cran.r-project.org/web/packages/txtplot/txtplot.pdf) package

{% highlight R %}
> install.packages("txtplot", dependencies=TRUE)
> txtboxplot(rnorm(100, 1, 2), rnorm(50, 2, 5))
{% endhighlight %}


Proper Plots with ggplot2
-------------------------
In order to get proper plots with `ggplot2` you have to set up an X server first. This can be done by installing an android app like e.g. [XServer XSDL](https://play.google.com/store/apps/details?id=x.org.server) and launching your favourite window manager into it.

Firstly start the X server, secondly your linux distro. Then introduce the two and start some window manager:

{% highlight bash %}
$ apt-get install i3
$ export DISPLAY=127.0.0.1:0.0
$ i3 &
{% endhighlight %}

In R, you can then use ggplot2 as you normally would.

{% highlight R %}
> install.packages("ggplot2", dependencies=TRUE)
> p <- qplot(gear, mpg, data=mtcars)
{% endhighlight %}

In order to see the resulting plot, switch to the X server and admire the view!
