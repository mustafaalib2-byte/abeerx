# ABEERX auto-posting: detailed setup

Follow the steps in order. Steps 1 to 3 happen on your phone or in a web browser. Steps 4 to 7 happen on the PC that has the `abeerx` folder (`C:\Users\user\Documents\GitHub\abeerx`).

Meta changes button names from time to time. If a button below is worded a little differently, look for the closest match.

---

## Step 1: Make Instagram a Business account and link it to your Facebook Page

The script can only post to an Instagram **Business** (or Creator) account that is linked to a Facebook **Page**. A personal Instagram account won't work.

**1a. Switch Instagram to Business** (in the Instagram app on your phone)
1. Open your profile (the ABEERX account), then tap the **☰ menu** at the top right.
2. Tap **Account type and tools**. In some versions it's under **Settings and privacy > For professionals**.
3. Tap **Switch to professional account**, then tap **Continue** through the screens.
4. Category: choose **Perfume store**. If that isn't listed, choose **Shopping & retail** or **Beauty, cosmetic & personal care**.
5. When it asks **Creator or Business**, choose **Business**.
6. It may ask to connect to Facebook here. If it does, pick your ABEERX Page, and you can skip 1b.

**1b. Link Instagram to the Facebook Page** (on a computer, at facebook.com)
1. Switch into your ABEERX Page: click your profile picture at the top right, then click the ABEERX Page.
2. Go to **Settings & privacy > Settings**.
3. In the left menu, find **Linked accounts** (sometimes under **Professional dashboard > Linked accounts**).
4. Next to **Instagram**, click **Connect**, log in to the ABEERX Instagram account, and allow access.

✅ **Check:** the Page's **Linked accounts** screen shows your Instagram username.

---

## Step 2: Create a Meta "app" (this gives the script permission to post)

This isn't an app on the App Store. It's only a key that lets your PC post on your behalf. It's free.

1. On a computer, go to **https://developers.facebook.com** and log in with the **same Facebook account that manages the ABEERX Page**.
2. If it's your first time, click **Get started** and verify your account (phone number or email). Choose **Developer** if it asks your role.
3. Click **My Apps** at the top, then the green **Create app** button.
4. **App name:** type `ABEERX Poster`. **Contact email:** your email. Click **Next**.
5. **Use cases** screen. Use whichever of these Meta shows you:
   - **If you see use cases:** tick **Manage everything on your Page** and **Manage messaging & content on Instagram**. If only one can be picked now, pick the Page one and add the Instagram one later from the app's dashboard. Then click **Next**.
   - **If you see "Other":** choose **Other**, click **Next**, choose app type **Business**, and click **Next**.
6. **Business portfolio:** pick your business if you have one in Meta Business Suite. Otherwise choose **I don't want to connect a business portfolio yet**.
7. Click **Create app** and type your Facebook password if asked.
8. In the left menu of the new app, open **App settings > Basic**.
   - Copy the **App ID** (a long number) and paste it into Notepad for now.
   - Next to **App secret**, click **Show**, type your password, then copy the secret into Notepad as well.

⚠️ The App secret is like a password. Don't share it or post it anywhere.

✅ **Check:** your Notepad now has the App ID and the App secret.

---

## Step 3: Get a login token with posting permissions

1. Open **https://developers.facebook.com/tools/explorer** (the "Graph API Explorer").
2. On the right side:
   - **Meta App:** choose **ABEERX Poster** (the app from Step 2).
   - **User or Page:** leave it on **User Token**.
3. Under **Permissions**, click **Add a Permission** and add each of these six. Type each name in the search box to find it.
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `instagram_basic`
   - `instagram_content_publish`
   - `business_management`
4. Click the blue **Generate Access Token** button. A Facebook window opens:
   - Click **Continue as (your name)**.
   - When it asks **which Pages**, tick **ABEERX**.
   - When it asks **which Instagram accounts**, tick your ABEERX Instagram.
   - Leave all permissions switched **on**, then click **Save** or **Done**.
5. A long token appears in the **Access Token** box (it starts with `EAA...`). Click the copy icon next to it and paste it into Notepad.

⏱️ This token **expires in about 1 hour**. Do steps 4 and 5 soon after. If you're too late, just do Step 3 again. Step 5 replaces it with a permanent key.

✅ **Check:** your Notepad has App ID, App secret, and the `EAA...` token.

---

## Step 4: Put the three values into `.env.local`

`.env.local` is a settings file in your abeerx folder. It already holds your Cloudflare keys, and it is never uploaded to GitHub.

1. Open File Explorer and go to `C:\Users\user\Documents\GitHub\abeerx`.
2. Find the file **`.env.local`**. Right-click it and choose **Open with > Notepad**. If you don't see it, click **View > Show > File name extensions** and **Hidden items**.
3. Go to the very end of the file, press **Enter** to start a new line, and add these three lines with your own values:

```
META_APP_ID=1234567890123456
META_APP_SECRET=abcdef0123456789abcdef0123456789
META_USER_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

   Rules:
   - One per line, exactly as shown.
   - No spaces around `=`.
   - No quotes.
   - Don't change or delete the lines that are already there.
4. If you have **more than one** Facebook Page, add one more line so the script picks the right one:
```
META_PAGE_NAME=ABEERX
```
5. Press **Ctrl + S** to save, then close Notepad.

✅ **Check:** reopen `.env.local`. The new lines are at the end and the old lines are still there.

---

## Step 5: Connect (one time): double-click `Social_Connect.bat`

1. In the abeerx folder, double-click **`Social_Connect.bat`**. A black window opens.
2. It exchanges your 1-hour token for a **permanent Page key** and saves it in `.env.local`.

✅ **Success looks like this:**
```
Pages found:
  * ABEERX (Instagram @abeerx)
Saved the keys for "ABEERX" into .env.local. You can now run Social_AutoPost.bat.
Facebook Page OK: ABEERX
Instagram OK: @abeerx (0 of 100 automated posts used in the last 24 hours)
```
3. Press any key to close the window.

After this, `.env.local` has three new lines: `META_PAGE_ID`, `META_IG_USER_ID` and `META_PAGE_TOKEN`. You can delete the `META_USER_TOKEN` line now, because it's no longer needed.

**If it shows an error:**

| Message | What to do |
|---|---|
| `Add META_APP_ID, META_APP_SECRET and META_USER_TOKEN...` | Step 4 isn't saved, or a name is misspelled. Check the three lines. |
| `Error validating access token` / `Session has expired` | The token is older than 1 hour. Do Step 3 again, replace the `META_USER_TOKEN` line, and run this again. |
| `No Facebook Pages found` | In Step 3, the ABEERX Page wasn't ticked. Do Step 3 again and tick it. |
| `(no Instagram linked)` next to your Page | Step 1b isn't done, or Instagram wasn't ticked in Step 3. |
| `Invalid client_secret` | The App secret was copied wrong. Copy it again (Step 2, point 8). |

---

## Step 6: First post, checked by you: double-click `Social_AutoPost.bat`

1. Double-click **`Social_AutoPost.bat`**.
2. It first shows a **preview** of the next perfume: the photo link, plus the Instagram and Facebook captions. **Nothing is posted yet.**
3. Read the preview. If it looks right, type **`y`** and press **Enter**. Any other key cancels.
4. It then:
   - makes a square photo,
   - uploads it to your Cloudflare storage,
   - posts to Instagram,
   - posts to Facebook.

✅ **Success looks like this:**
```
Instagram: posted (1789...)
Facebook: posted (1234..._5678...)
Done. All posted.
```
5. Open Instagram and your Facebook Page and look at the new post.

If one platform says **FAILED**, the reason is printed next to it. That perfume is tried again on the next run. Send me a screenshot of the window and I'll fix it.

---

## Step 7: Turn on daily posting: double-click `Social_Schedule.bat`

1. Double-click **`Social_Schedule.bat`**.
2. It adds 3 tasks to Windows Task Scheduler. Each posts **one perfume** at **12:00, 17:00 and 21:00** every day.

✅ **Success looks like this:** `SUCCESS: The scheduled task "ABEERX Social Post 1" has successfully been created.` (three times), then `Automatic posting is ON`.

Good to know:
- **The PC must be on and logged in** at those times. A missed time is skipped, and the next post goes out as normal.
- Every run is written to **`social_autopost.log`** in the abeerx folder. Open it with Notepad to see what was posted or why something failed.
- **To stop:** open Command Prompt in the abeerx folder and type `Social_Schedule.bat off`. Or open **Task Scheduler** from the Start menu and delete the three "ABEERX Social Post" tasks.
- **To post more per run:** add `SOCIAL_POSTS_PER_RUN=2` to `.env.local`.
- **To post to only one platform:** add `SOCIAL_PLATFORMS=instagram` or `SOCIAL_PLATFORMS=facebook` to `.env.local`.

---

## About "Development mode"

Your Meta app stays in **Development mode**, and that's fine. Meta's review is only needed when an app posts for other people. Here you are the app's admin, posting to your own Page and Instagram, so no review or business verification is needed.
