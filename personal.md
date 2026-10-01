Honestly, this project didn't start as a project. It started with me looking for a way to make my first $40 from code.

I'm a 7th semester student in India, and I spent a few days going through bounty sites. Every bounty that looked doable was already taken, closed, or had 15+ people fighting over it. Somewhere in that search I found this challenge, and Path 2 said "something strange", which felt like permission to stop being sensible.

The idea came from all those closed issues I was reading. Bugs get fixed, everyone moves on, and a few months later the same bug is back with a new ticket number. Nobody remembers it was here before. So I thought: what if fixed bugs actually got buried, and when one came back, it came back as a zombie?

I want to be upfront about how it was built. I didn't write most of this code by hand. I worked with Claude Code, phase by phase. My job was deciding what to build, testing everything, catching what was broken, and saying no a lot. I started late on Sep 28 and some of the testing happened at 2 AM, clicking "Report resurrection" over and over to see if the button would flicker again.

I don't have years of my own bug history, so the graves are classic bugs every developer has met: floating point money, timezones, merge conflicts in production. I'd rather be honest about that than pretend they're mine.

After reading other entries, I realised a cute graveyard wasn't enough. That's when the Zombie Detector happened. The moment it flagged a new "dates are off by one day" report as a possible return of the timezone bug, and showed me exactly why (same cause, same component, shared words), was the moment this stopped feeling like a joke project to me.

The biggest thing I learned: Sanity is not just a place to store content. Custom actions, a Tombstone preview inside the Studio, scheduled Functions, an app in the Dashboard. It felt more like building a small tool than filling a CMS.
