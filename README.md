[![pages-build-deployment](https://github.com/nuke-haus/perfumenuke/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/nuke-haus/perfumenuke/actions/workflows/pages/pages-build-deployment)

# PerfumeNuke
An open-source perfume formulation tool and material database. 

# How To Use

Open the tool in your web browser: https://nuke-haus.github.io/perfumenuke/

Here's a quickstart guide video (slightly outdated): https://youtu.be/qmItmpbxNyI

On the formula page you can load formulas from the database and modify them or create new ones. The information display below the formula editor will automatically update to reflect any changes made in the editor.

On the database page you can import and export material, mixture and formula data. Use the material and mixture editors to load existing data and modify it, or create new materials and mixtures. 

- Most aromachemicals typically fall under the **material** category, unless they are comprised of multiple chemicals that have their own IFRA number. 
- Complex substances (like most essential oils and certain aromachemicals) would typically be entered as a **mixture** as they contain several different components. 
- Dilutions should be entered in the database as a **mixture** as well since they are comprised of a dilutant and an aromachemical. 
- Accord blends should also be entered as **mixtures** in the database.
- Mixtures can also contain other mixtures. For example, if you have a mixture of 2 chemicals you can create a 10% dilution of this mixture. Nesting of mixtures only works once, so you cannot create something like a dilution of a dilution of a mixture.

Your work is saved between sessions, be sure to click the save button to save your current changes before leaving the page though.

# Wishlist

These are features and other things i'd like to eventually have in this tool.

- Desperately need to expand the material and mixture database some more.
- Maybe some sort of graph visualizers on the formula page.
