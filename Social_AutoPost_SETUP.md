# ABEERX automatic Instagram + Facebook posting

Posts one in-stock perfume at a time to your Instagram and Facebook Page, each with its photo, an English + Arabic caption and a link to the product page. Captions never show prices, because prices change in the POS. It reads the same live product feed as Google Shopping, so it never posts a sold-out or unpriced perfume. It remembers what it has already posted (in `social_posted.json`), and once every perfume has been posted it starts again from the top.

## Files (in your abeerx folder)

| File | What it does |
|---|---|
| `Social_Connect.bat` | One-time: connects your Instagram + Facebook Page and saves the keys |
| `Social_AutoPost.bat` | Shows a preview of the next post, then posts it if you type `y` |
| `Social_Schedule.bat` | Turns on automatic posting at 12:00, 17:00 and 21:00 every day. `Social_Schedule.bat off` turns it off |
| `Social_AutoPost_Run.bat` | What the schedule runs. Results go to `social_autopost.log` |
| `Social_AutoPost.js` | The script itself |

## One-time setup (about 15 minutes)

1. **Instagram as a Business account linked to your Page.** In the Instagram app: Settings > Account type and tools > Switch to professional account > Business. Then in your Facebook Page settings > Linked accounts, connect that Instagram account.
2. **Create a Meta app.** Go to developers.facebook.com > My Apps > Create app. Choose the **Business** type (or the "Manage everything on your Page" and "Instagram content" use cases if it asks for use cases). Then open App settings > Basic and copy the **App ID** and **App Secret**.
3. **Get a login token.** Open developers.facebook.com/tools/explorer, pick your app at the top right, click **Generate Access Token** and tick these permissions:
   `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `instagram_basic`, `instagram_content_publish`, `business_management`.
   When Facebook asks, allow your ABEERX Page and Instagram account. Copy the token it shows.
4. **Paste three lines into `.env.local`** in the abeerx folder (it already holds your Cloudflare keys and is never uploaded to GitHub):
   ```
   META_APP_ID=your app id
   META_APP_SECRET=your app secret
   META_USER_TOKEN=the token from step 3
   ```
5. **Double-click `Social_Connect.bat`.** It turns that short-lived token into a permanent Page key, saves `META_PAGE_ID`, `META_IG_USER_ID` and `META_PAGE_TOKEN` into `.env.local`, and checks they work. If you have more than one Page, add `META_PAGE_NAME=ABEERX` first so it picks the right one.
6. **Double-click `Social_AutoPost.bat`.** Check the preview, type `y`, then look at Instagram and Facebook to see the first real post.
7. **Double-click `Social_Schedule.bat`** to turn on daily posting.

The app can stay in Development mode. Because you are the app's admin posting to your own Page, Meta does not need to review it.

## Good to know

- **The PC has to be on** at the posting times, because the schedule runs on this computer. If it's off, that post is skipped and the next one goes out as normal.
- **How many a day:** 3 by default (one per scheduled time). To post more each time, add `SOCIAL_POSTS_PER_RUN=2` to `.env.local`. Instagram allows at most about 100 automated posts a day, but 3 to 6 is healthier for reach.
- **Only one platform:** add `SOCIAL_PLATFORMS=instagram` or `SOCIAL_PLATFORMS=facebook` to `.env.local`.
- **Photos:** each product photo is made into a square 1080 x 1080 JPEG on a white background (Instagram won't take WebP) and uploaded to your Cloudflare storage under `social/`.
- **If a post fails** (an expired key, for example), it is retried on the next run, and the reason is written to `social_autopost.log`. Running `node Social_AutoPost.js --check` tells you whether the keys still work.
- **Arabic captions** use the English perfume name, because the product data has no Arabic names.
