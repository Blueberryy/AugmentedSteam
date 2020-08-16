let GroupID = (function(){

    let self = {};
    let _groupId = null;

    self.getGroupId = function() {
        if (_groupId) { return _groupId; }

        if (document.querySelector("#leave_group_form")) {
            _groupId = document.querySelector("input[name=groupId]").value;
        } else {
            _groupId = document.querySelector(".joinchat_bg").getAttribute("onclick").split('\'')[1];
        }

        return _groupId;
    };

    return self;
})();

let ProfileHomePageClass = (function(){

    function ProfileHomePageClass() {
        // If there is an error message, like profile does not exists. 
        if (document.querySelector("#message")) {
            return;
        }
        if (window.location.hash === "#as-success") {
            /* TODO This is a hack. It turns out, that clearOwn clears data, but immediately reloads them.
             *      That's why when we clear profile before going to API to store changes we don't get updated images
             *      when we get back.
             *      clearOwn shouldn't immediately reload.
             *
             *      Also, we are hoping for the best here, we should probably await?
             */
            ProfileData.clearOwn();
        }
        ProfileData.promise();
        this.addCommunityProfileLinks();
        this.addWishlistProfileLink();
        this.addSupporterBadges();
        this.changeUserBackground();
        this.addProfileStoreLinks();
        this.addSteamRepApi();
        this.userDropdownOptions();
        this.inGameNameLink();
        this.addProfileStyle();
        this.addTwitchInfo();
        this.chatDropdownOptions();
    }

    ProfileHomePageClass.prototype.addCommunityProfileLinks = function() {
        let steamId = SteamId.getSteamId();

        let iconType = "none";
        let images = SyncedStorage.get("show_profile_link_images");
        if (images !== "none") {
            iconType = images === "color" ? "color" : "gray";
        }

        let links = [
            {
                "id": "steamrep",
                "link": `https://steamrep.com/profiles/${steamId}`,
                "name": "SteamRep",
            },
            {
                "id": "steamdbcalc",
                "link": `https://steamdb.info/calculator/?player=${steamId}`,
                "name": "SteamDB",
            },
            {
                "id": "steamgifts",
                "link": `https://www.steamgifts.com/go/user/${steamId}`,
                "name": "SteamGifts",
            },
            {
                "id": "steamtrades",
                "link": `https://www.steamtrades.com/user/${steamId}`,
                "name": "SteamTrades",
            },
            {
                "id": "bartervg",
                "link": `//barter.vg/steam/${steamId}`,
                "name": "Barter.vg",
            },
            {
                "id": "astats",
                "link": `https://www.achievementstats.com/index.php?action=profile&playerId=${steamId}`,
                "name": "Achievement Stats",
            },
            {
                "id": "backpacktf",
                "link": `https://backpack.tf/profiles/${steamId}`,
                "name": "Backpack.tf",
            },
            {
                "id": "astatsnl",
                "link": `https://astats.astats.nl/astats/User_Info.php?steamID64=${steamId}`,
                "name": "AStats.nl",
            }
        ];

        // Add "SteamRepCN"
        let language = Language.getCurrentSteamLanguage();
        if ((language === "schinese" || language === "tchinese") && SyncedStorage.get('profile_steamrepcn')) {
            links.push({
                "id": "steamrepcn",
                "link": `//steamrepcn.com/profiles/${steamId}`,
                "name": (language === "schinese" ? "查看信誉记录" : "確認信譽記錄")
            });
        }

        // Build the links HTML
        let htmlstr = "";

        for (let link of links) {
            if (!SyncedStorage.get("profile_" + link.id)) { continue; }
            htmlstr += CommunityCommon.makeProfileLink(link.id, link.link, link.name, iconType);
        }

        // custom profile link
        for (let customLink of SyncedStorage.get('profile_custom_link')) {
            if (!customLink || !customLink.enabled) {
                continue;
            }

            let customUrl = customLink.url;
            if (!customUrl.includes("[ID]")) {
                customUrl += "[ID]";
            }

            let name =  HTML.escape(customLink.name);
            let link = "//" + HTML.escape(customUrl.replace("[ID]", steamId));
            let icon;
            if (customLink.icon) {
                icon = "//" + HTML.escape(customLink.icon);
            } else {
                iconType = "none";
            }

            htmlstr += CommunityCommon.makeProfileLink("custom", link, name, iconType, icon);
        }

        // profile steamid
        if (SyncedStorage.get("profile_steamid")) {
            let dropdown = document.querySelector("#profile_action_dropdown .popup_body.popup_menu");
            if (dropdown) {
                HTML.beforeEnd(dropdown,
                    `<a class="popup_menu_item" id="es_steamid">
                        <img src="https://steamcommunity-a.akamaihd.net/public/images/skin_1/iconForums.png">&nbsp; ${Localization.str.view_steamid}
                    </a>`);
            } else {
                let actions = document.querySelector(".profile_header_actions");
                if (actions) {
                    HTML.beforeEnd(actions,
                        `<a class="btn_profile_action btn_medium" id="es_steamid">
                            <span>${Localization.str.view_steamid}</span>
                        </a>`);
                }
            }

            document.querySelector("#es_steamid").addEventListener("click", showSteamIdDialog);
        }

        // Insert the links HMTL into the page
        if (htmlstr) {
            let linksNode = document.querySelector(".profile_item_links");
            if (linksNode) {
                HTML.beforeEnd(linksNode,  htmlstr + '<div style="clear: both;"></div>');
            } else {
                let rightColNode = document.querySelector(".profile_rightcol");
                HTML.beforeEnd(rightColNode, '<div class="profile_item_links">' + htmlstr + '</div>');
                HTML.afterEnd(rightColNode, '<div style="clear: both;"></div>');
            }
        }

        function copySteamId(e) {
            let elem = e.target.closest(".es-copy");
            if (!elem) { return; }

            Clipboard.set(elem.querySelector(".es-copy__id").innerText);

            let lastCopied = document.querySelector(".es-copy.is-copied");
            if (lastCopied) {
                lastCopied.classList.remove("is-copied");
            }

            elem.classList.add("is-copied");
            window.setTimeout(() => { elem.classList.remove("is-copied")}, 2000);
        }

        function showSteamIdDialog() {
            document.addEventListener("click", copySteamId);

            let imgUrl = ExtensionResources.getURL("img/clippy.svg");

            let steamId = new SteamId.Detail(SteamId.getSteamId());
            let ids = [
                steamId.id2,
                steamId.id3,
                steamId.id64,
                `https://steamcommunity.com/profiles/${steamId.id64}`
            ];

            let copied = Localization.str.copied;
            let html = "";
            for (let id of ids) {
                if (!id) { continue; }
                html += `<p><a class="es-copy"><span class="es-copy__id">${id}</span><img src='${imgUrl}' class="es-copy__icon"><span class="es-copy__copied">${copied}</span></a></p>`
            }

            ExtensionLayer.runInPageContext((steamidOfUser, html, close) => {
                HideMenu("profile_action_dropdown_link", "profile_action_dropdown");
                let dialog = ShowAlertDialog(steamidOfUser.replace("__user__", g_rgProfileData.personaname), html, close);

                return new Promise(resolve => { dialog.done(() => { resolve(); }); });
            },
            [
                Localization.str.steamid_of_user,
                html,
                Localization.str.close,
            ], "closeDialog")
            .then(() => { document.removeEventListener("click", copySteamId); });
        }
    };

    ProfileHomePageClass.prototype.addWishlistProfileLink = async function() {
        if (document.querySelector("body.profile_page.private_profile")) { return; }
        if (!SyncedStorage.get("show_wishlist_link")) { return; }
        if (!document.querySelector(".profile_item_links")) { return; }

        let m = window.location.pathname.match(/(profiles|id)\/[^\/]+/);
        if (!m) { return; }

        HTML.afterEnd(".profile_item_links .profile_count_link",
            `<div id="es_wishlist_link" class="profile_count_link">
                <a href="//store.steampowered.com/wishlist/${m[0]}">
                    <span class="count_link_label">${Localization.str.wishlist}</span>&nbsp;
                    <span id="es_wishlist_count" class="profile_count_link_total"></span>
                </a>
            </div>`);

        if (SyncedStorage.get("show_wishlist_count")) {

            let wishlistNode = document.querySelector(`.gamecollector_showcase .showcase_stat[href$="/wishlist/"]`);
            let count = wishlistNode ? wishlistNode.textContent.match(/\d+(?:,\d+)?/)[0] : await Background.action("wishlists", window.location.pathname);

            document.querySelector("#es_wishlist_count").textContent = count;
        }
    };

    ProfileHomePageClass.prototype.addSupporterBadges = function() {
        ProfileData.promise().then(data => {
            if (!data) { return; }

            let badgeCount = data["badges"].length;
            if (badgeCount === 0) { return;}

            let profileBadges = document.querySelector(".profile_badges");
            if (!profileBadges) { return; }

            let html =
                `<div class="profile_badges" id="es_supporter_badges">
                    <div class="profile_count_link">
                        <a href="${Config.PublicHost}">
                            <span class="count_link_label">${Localization.str.es_supporter}</span>&nbsp;
                            <span class="profile_count_link_total">${badgeCount}</span>
                        </a>
                    </div>
                    <div class="profile_count_link_preview">`;


            for (let i=0; i < badgeCount; i++) {
                if (data["badges"][i].link) {
                    html += '<div class="profile_badges_badge" data-tooltip-html="Augmented Steam<br>' + data["badges"][i].title + '"><a href="' + data["badges"][i].link + '"><img class="badge_icon small" src="' + data["badges"][i].img + '"></a></div>';
                } else {
                    html += '<div class="profile_badges_badge" data-tooltip-html="Augmented Steam<br>' + data["badges"][i].title + '"><img class="badge_icon small" src="' + data["badges"][i].img + '"></div>';
                }
            }

            html += '</div></div>';

            HTML.afterEnd(profileBadges, html);

            ExtensionLayer.runInPageContext(() => { SetupTooltips({ tooltipCSSClass: "community_tooltip" }); });
        });
    };

    ProfileHomePageClass.prototype.changeUserBackground = async function() {
        let prevHash = window.location.hash.match(/#previewBackground\/(\d+)\/([a-z0-9.]+)/i);

        if (prevHash) {
            let imgUrl = "//steamcdn-a.akamaihd.net/steamcommunity/public/images/items/" + prevHash[1] + "/" + prevHash[2];
            // Make sure the url is for a valid background image
            HTML.beforeEnd(document.body, '<img class="es_bg_test" style="display: none" src="' + imgUrl + '" />');
            document.querySelector("img.es_bg_test").addEventListener("load", function() {
                let nodes = document.querySelectorAll(".no_header.profile_page, .profile_background_image_content");
                for (let i=0, len=nodes.length; i<len; i++) {
                    let node = nodes[i];
                    node.style.backgroundImage = "url('"+imgUrl+"')";
                }
                document.querySelector(".es_bg_test").remove();
            });
            return;
        }

        if (document.querySelector(".profile_page.private_profile")) {
            return;
        }

        await ProfileData;
        let bg = ProfileData.getBgImgUrl();
        if (!bg) { return; }

        document.querySelector(".no_header").style.backgroundImage = "url(" + bg + ")";

        let node = document.querySelector(".profile_background_image_content");
        if (node) {
            node.style.backgroundImage = "url(" + bg + ")";
            return;
        }

        document.querySelector(".no_header").classList.add("has_profile_background");
        node = document.querySelector(".profile_content");
        node.classList.add("has_profile_background");
        HTML.afterBegin(node, '<div class="profile_background_holder_content"><div class="profile_background_overlay_content"></div><div class="profile_background_image_content " style="background-image: url(' + bg + ');"></div></div></div>');
    };

    ProfileHomePageClass.prototype.addProfileStoreLinks = function() {
        let nodes = document.querySelectorAll(".game_name .whiteLink");
        for (let i=0, len=nodes.length; i<len; i++) {
            let node = nodes[i];
            let href = node.href.replace("//steamcommunity.com", "//store.steampowered.com");
            HTML.afterEnd(node, "<br><a class='whiteLink' style='font-size: 10px;' href=" + href + ">" + Localization.str.visit_store + "</a>");
        }
    };

    ProfileHomePageClass.prototype.addSteamRepApi = function() {
        if (!SyncedStorage.get("showsteamrepapi")) { return; }

        ProfileData.promise().then(data => {
            if (!data.steamrep || data.steamrep.length === 0) { return; }

            let steamId = SteamId.getSteamId();
            if (!steamId) { return; }

            // Build reputation images regexp
            let repImgs = {
                "banned": /scammer|banned/gi,
                "valve": /valve admin/gi,
                "caution": /caution/gi,
                "okay": /admin|middleman/gi,
                "donate": /donator/gi
            };

            let html = "";

            for (let value of data.steamrep) {
                if (value.trim() === "") { continue; }
                for (let [img, regex] of Object.entries(repImgs)) {
                    if (!value.match(regex)) { continue; }

                    let imgUrl = ExtensionResources.getURL(`img/sr/${img}.png`);
                    let status;

                    switch (img) {
                        case "banned":
                            status = "bad";
                            break;
                        case "caution":
                            status = "caution";
                            break;
                        case "valve":
                        case "okay":
                            status = "good";
                            break;
                        case "donate":
                            status = "neutral";
                            break;
                    }

                    html += `<div class="${status}"><img src="${imgUrl}"><span> ${value}</span></div>`;
                }
            }

            if (html) {

                HTML.afterBegin(".profile_rightcol",
                    `<a id="es_steamrep" href="https://steamrep.com/profiles/${steamId}" target="_blank">
                        ${html}
                    </a>`);
            }
        });
    };

    ProfileHomePageClass.prototype.userDropdownOptions = function() {

        let node = document.querySelector("#profile_action_dropdown .popup_body .profile_actions_follow");
        if (!node) { return; }

        // add nickname option for non-friends
        if (User.isSignedIn) {

            // check whether we can chat => if we can we are friends => we have nickname option
            let canAddFriend = document.querySelector("#btn_add_friend");
            if (canAddFriend) {

                HTML.afterEnd(node, `<a class="popup_menu_item" id="es_nickname"><img src="https://steamcommunity-a.akamaihd.net/public/images/skin_1/notification_icon_edit_bright.png">&nbsp; ${Localization.str.add_nickname}</a>`);

                node.parentNode.querySelector("#es_nickname").addEventListener("click", function() {
                    ExtensionLayer.runInPageContext(() => {
                        ShowNicknameModal();
                        HideMenu("profile_action_dropdown_link", "profile_action_dropdown" );
                    });
                });
            }
        }

        // post history link
        HTML.afterEnd(node,
                `<a class='popup_menu_item' id='es_posthistory' href='${window.location.pathname}/posthistory'>
                <img src='//steamcommunity-a.akamaihd.net/public/images/skin_1/icon_btn_comment.png'>&nbsp; ${Localization.str.post_history}
                </a>`);
    };

    ProfileHomePageClass.prototype.inGameNameLink = function() {
        let ingameNode = document.querySelector("input[name='ingameAppID']");
        if (!ingameNode || !ingameNode.value) { return; }

        let tooltip = Localization.str.view_in_store;

        let node = document.querySelector(".profile_in_game_name");
        HTML.inner(node, `<a data-tooltip-html="${tooltip}" href="//store.steampowered.com/app/${ingameNode.value}" target="_blank">${node.textContent}</a>`);
        ExtensionLayer.runInPageContext(() => { SetupTooltips({ tooltipCSSClass: "community_tooltip" }); });
    };

    ProfileHomePageClass.prototype.addProfileStyle = function() {
        if (document.querySelector("body.profile_page.private_profile")) { return; }

        ProfileData.promise().then(data => {
            if (!data || !data.style) { return; }

            let style = ProfileData.getStyle();
            let stylesheet = document.createElement('link');
            stylesheet.rel = 'stylesheet';
            stylesheet.type = 'text/css';
            let availableStyles = ["clear", "goldenprofile", "green", "holiday2014", "orange", "pink", "purple", "red", "teal", "yellow", "blue", "grey"];
            if (availableStyles.indexOf(style) === -1) { return; }

            document.body.classList.add("es_profile_style");
            switch (style) {
                case "goldenprofile":
                    stylesheet.href = 'https://steamcommunity-a.akamaihd.net/public/css/promo/lny2019/goldenprofile.css';
                    document.head.appendChild(stylesheet);

                    let container = document.createElement("div");
                    container.classList.add("profile_lny_wrapper");

                    let profilePageNode = document.querySelector(".responsive_page_template_content .profile_page");
                    DOMHelper.wrap(container, profilePageNode);

                    profilePageNode.classList.add("lnyprofile");

                    HTML.afterBegin(profilePageNode,
                        `<div class="lny_sides_position">
                            <div class="lny_side left">
                                <div class="lny_side_background"></div>
                                <div class="lny_top"></div>
                                <div class="lny_pig"></div>
                                <div class="lny_pendulum">
                                    <div class="lny_strings"></div>
                                    <img src="https://steamcdn-a.akamaihd.net/steamcommunity/public/assets/lny2019/goldenprofile/test_lantern1.png">
                                </div>
                            </div>
                            <div class="lny_side right">
                                <div class="lny_side_background"></div>
                                <div class="lny_top"></div>
                                <div class="lny_pig"></div>
                                <div class="lny_pendulum">
                                    <div class="lny_strings"></div>
                                    <img src="https://steamcdn-a.akamaihd.net/steamcommunity/public/assets/lny2019/goldenprofile/test_lantern2.png">
                                </div>
                            </div>
                        </div>`);

                    HTML.beforeBegin(
                        ".profile_header",
                        `<div class="lny_header">
                            <div class="lny_pig_center"></div>
                        </div>`);

                    break;
                case "holiday2014":
                    stylesheet.href = '//steamcommunity-a.akamaihd.net/public/css/skin_1/holidayprofile.css';
                    document.head.appendChild(stylesheet);

                    HTML.beforeEnd(".profile_header_bg_texture", "<div class='holidayprofile_header_overlay'></div>");
                    document.querySelector(".profile_page").classList.add("holidayprofile");

                    DOMHelper.insertScript({ src: ExtensionResources.getURL("js/steam/holidayprofile.js") });
                    
                    break;
                case "clear":
                    document.body.classList.add("es_style_clear");
                    break;
                default:
                    let styleUrl = ExtensionResources.getURL("img/profile_styles/" + style + "/style.css");
                    let headerImg = ExtensionResources.getURL("img/profile_styles/" + style + "/header.jpg");
                    let showcase = ExtensionResources.getURL("img/profile_styles/" + style + "/showcase.png");

                    stylesheet.href = styleUrl;
                    document.head.appendChild(stylesheet);

                    document.querySelector(".profile_header_bg_texture").style.backgroundImage = "url('" + headerImg + "')";
                    document.querySelectorAll(".profile_customization").forEach(node => node.style.backgroundImage = "url('" + showcase + "')");
                    break;
            }
            stylesheet = null;
        });
    };

    ProfileHomePageClass.prototype.addTwitchInfo = async function() {

        if (!SyncedStorage.get('profile_showcase_twitch')) { return; }

        if (User.isSignedIn && !SyncedStorage.get('profile_showcase_own_twitch')) {
            if (window.location.pathname == User.profilePath) {
                // Don't show our Twitch.tv showcase on our own profile
                return;
            }
        }

        let selector = ".profile_summary a[href*='twitch.tv/']";
        if (!SyncedStorage.get('profile_showcase_twitch_profileonly')) {
            selector += ", .customtext_showcase a[href*='twitch.tv/']";
        }
        let search = document.querySelector(selector);
        if (!search) { return; }

        let m = search.href.match(/twitch\.tv\/(.+)/);
        if (!m) { return; }

        let twitchId = m[1].replace(/\//g, "");

        let data = await Background.action("twitch.stream", { 'channel': twitchId, } );

        // If the channel is not streaming, the response is: {"result":"success","data":[]}
        if (Array.isArray(data)) { return; }
        
        let channelUsername = data.user_name;
        let channelUrl = search.href;
        let channelGame = data.game;
        let channelViewers = data.viewer_count;
        let previewUrl = data.thumbnail_url.replace("{width}", 636).replace("{height}", 358) + "?" + Math.random();

        HTML.afterBegin(".profile_leftcol",
            `<div class='profile_customization' id='es_twitch'>
                    <div class='profile_customization_header'>
                        ${Localization.str.twitch.now_streaming.replace("__username__", channelUsername)}
                    </div>
                    <a class="esi-stream" href="${channelUrl}">
                        <div class="esi-stream__preview">
                            <img src="${previewUrl}">
                            <img src="https://steamstore-a.akamaihd.net/public/shared/images/apphubs/play_icon80.png" class="esi-stream__play">
                            <div class="esi-stream__live">Live on <span class="esi-stream__twitch">Twitch</span></div>
                        </div>
                        <div class="esi-stream__title">
                            <span class="live_stream_app">${channelGame}</span>
                            <span class="live_steam_viewers">${channelViewers} ${Localization.str.twitch.viewers}</span>
                        </div>
                    </a>
                </div>`);
    };

    ProfileHomePageClass.prototype.chatDropdownOptions = function() {
        if (!User.isSignedIn) { return; }

        let sendButton = document.querySelector("div.profile_header_actions > a[href*=OpenFriendChat]");
        if (!sendButton) { return; }

        let m = sendButton.href.match(/javascript:OpenFriendChat\( '(\d+)'.*\)/);
        if (!m) { return; }
        let chatId = m[1];

        let rgProfileData = HTMLParser.getVariableFromDom("g_rgProfileData", "object");
        let friendSteamId = rgProfileData.steamid;

        HTML.replace(sendButton,
            `<span class="btn_profile_action btn_medium" id="profile_chat_dropdown_link">
                <span>${sendButton.textContent}<img src="https://steamcommunity-a.akamaihd.net/public/images/profile/profile_action_dropdown.png"></span>
            </span>
            <div class="popup_block" id="profile_chat_dropdown" style="visibility: visible; top: 168px; left: 679px; display: none; opacity: 1;">
                <div class="popup_body popup_menu shadow_content" style="box-shadow: 0 0 12px #000">
                    <a id="btnWebChat" class="popup_menu_item webchat">
                        <img src="https://steamcommunity-a.akamaihd.net/public/images/skin_1/icon_btn_comment.png">
                        &nbsp; ${Localization.str.web_browser_chat}
                    </a>
                    <a class="popup_menu_item" href="steam://friends/message/${friendSteamId}">
                        <img src="https://steamcommunity-a.akamaihd.net/public/images/skin_1/icon_btn_comment.png">
                        &nbsp; ${Localization.str.steam_client_chat}
                    </a>
                </div>
            </div>`);

        document.querySelector("#btnWebChat").addEventListener("click", () => {
            ExtensionLayer.runInPageContext(chatId => { OpenFriendChatInWebChat(chatId); }, [ chatId ]);
        });

        document.querySelector("#profile_chat_dropdown_link").addEventListener("click", () => {
            ExtensionLayer.runInPageContext(() => { ShowMenu(document.querySelector("#profile_chat_dropdown_link"), "profile_chat_dropdown", "right"); });
        });
    };

    return ProfileHomePageClass;
})();


let GroupHomePageClass = (function(){

    function GroupHomePageClass() {
        this.groupId = GroupID.getGroupId();

        this.addGroupLinks();
        this.addFriendsInviteButton();
    }

    GroupHomePageClass.prototype.addGroupLinks = function() {

        let iconType = "none";
        let images = SyncedStorage.get("show_profile_link_images");
        if (images !== "none") {
            iconType = images === "color" ? "color" : "gray";
        }

        let links = [
            {
                "id": "steamgifts",
                "link": `https://www.steamgifts.com/go/group/${this.groupId}`,
                "name": "SteamGifts",
            }
        ];

        let html = "";
        for (let link of links) {
            if (!SyncedStorage.get(`group_${link.id}`)) { continue; }
            html += CommunityCommon.makeProfileLink(link.id, link.link, link.name, iconType);
        }

        if (html) {
            let node = document.querySelector(".responsive_hidden > .rightbox");
            if (node) {
                HTML.afterEnd(node.parentNode,
                    `<div class="rightbox_header"></div>
                    <div class="rightbox">
                        <div class="content">${html}</div>
                    </div>
                    <div class="rightbox_footer"></div>`);
            }
        }
    };

    GroupHomePageClass.prototype.addFriendsInviteButton = function() {
        if (!User.isSignedIn) { return; }

        let button = document.querySelector(".grouppage_join_area");
        if (button) { return; }

        HTML.afterEnd("#join_group_form", 
            `<div class="grouppage_join_area">
                <a class="btn_blue_white_innerfade btn_medium" href="https://steamcommunity.com/my/friends/?invitegid=${this.groupId}">
                    <span><img src="//steamcommunity-a.akamaihd.net/public/images/groups/icon_invitefriends.png">&nbsp; ${Localization.str.invite_friends}</span>
                </a>
            </div>`);
    };
    
    return GroupHomePageClass;
})();

let StatsPageClass = (function(){

    function StatsPageClass() {

        // handle compare redirect
        if (window.location.hash === "#es-compare") {
            window.location.hash = "";
            if (/\/stats\/[^\/]+(?!\/compare)\/?$/.test(window.location.pathname)) { // redirect to compare page but only if we're not there yet
                window.location = window.location.pathname.replace(/\/$/, "")+"/compare";
            }
        }

        this.addAchievementSort();
        this.showEntireDescriptions();
    }

    let _nodes = {
        "default": [],
        "time": []
    };

    function addSortMetaData(key, achievements) {
        if (key === "default") {
            achievements.forEach((row, i) => _nodes.default.push([i, row]));
            return Promise.resolve();
        } else if (key === "time") {
            let url = new URL(window.location.href);
            url.searchParams.append("xml", 1);
            return RequestData.getHttp(url.toString()).then(result => {
                let xmlDoc = new DOMParser().parseFromString(result, "text/xml");
                let xmlTags = xmlDoc.getElementsByTagName("achievement");
                for (let i = 0; i < _nodes.default.length; ++i) {
                    let node = _nodes.default[i][1];
                    let unlockTime = 0;
                    let unlockTimestamp = xmlTags[i].querySelector("unlockTimestamp");
                    if (unlockTimestamp) {
                        unlockTime = unlockTimestamp.textContent;
                    }
                    _nodes.time.push([unlockTime, node]);

                    node.classList.add(unlockTime === 0 ? "esi_ach_locked" : "esi_ach_unlocked");
                }
            }).then(() => _nodes.time = _nodes.time.sort((a, b) => {
                return b[0] - a[0]; // descending sort
            })).catch(err => console.error("Failed to retrieve timestamps for the achievements", err));
        }
    }

    async function sortBy(key, reversed) {
        let personal = document.querySelector("#personalAchieve");
        if (key === "time") {
            if (!_nodes.time.length) {
                await addSortMetaData(key, personal.querySelectorAll(".achieveRow"));
            }
        }
        
        for (let br of personal.querySelectorAll(":scope > br")) br.remove();
        for (let [, node] of _nodes[key]) {
            personal.insertAdjacentElement(reversed ? "afterbegin" : "beforeend", node);
        }
    }

    StatsPageClass.prototype.addAchievementSort = function() {
        let personal = document.querySelector("#personalAchieve");
        if (!personal) { return; }

        document.querySelector("#tabs").insertAdjacentElement("beforebegin", Sortbox.get(
            "achievements",
            [
                ["default", Localization.str.theworddefault],
                ["time", Localization.str.date_unlocked],
            ],
            "default",
            sortBy
        ));

        addSortMetaData("default", personal.querySelectorAll(".achieveRow"));
    };
    

    StatsPageClass.prototype.showEntireDescriptions = function() {
        // .ellipsis is only added by Steam on personal stats pages
        let nodes = document.querySelectorAll("h5.ellipsis");
        for (let node of nodes) {
            node.classList.remove("ellipsis");
        }
    };

    return StatsPageClass;
})();

let RecommendedPageClass = (function(){

    function RecommendedPageClass() {
        this.addReviewSort();
    }

    RecommendedPageClass.prototype.addReviewSort = async function() {
        let numReviewsNode = document.querySelector(".review_stat:nth-child(1) .giantNumber");
        if (!numReviewsNode) { return; }

        let numReviews = Number(numReviewsNode.innerText);
        if (isNaN(numReviews) || numReviews <= 1) { return; }

        let steamId = window.location.pathname.match(/\/((?:id|profiles)\/.+?)\//)[1];
        let params = new URLSearchParams(window.location.search);
        let curPage = params.get("p") || 1;
        let pageCount = 10;
        let reviews;

        async function getReviews() {

            let modalActive = false;

            // Delay half a second to avoid dialog flicker when grabbing cache
            let delayer = setTimeout(
                () => {
                    ExtensionLayer.runInPageContext(
                        (processing, wait) => { ShowBlockingWaitDialog(processing, wait); },
                        [
                            Localization.str.processing,
                            Localization.str.wait
                        ]);
                    modalActive = true;
                },
                500,                
            );

            try {
                reviews = await Background.action("reviews", steamId, numReviews);

                reviews.map((review, i) => {
                    review.default = i;
                    return review;
                });
            } finally {
                clearTimeout(delayer);

                if (modalActive) {
                    ExtensionLayer.runInPageContext(() => {
                        CModal.DismissActiveModal();
                    });
                }
            }
        }

        async function sortReviews(sortBy, reverse) {
            if (!reviews) {
                await getReviews();
            }

            for (let node of document.querySelectorAll(".review_box")) {
                node.remove();
            }

            let displayedReviews = reviews.sort((a, b) => {
                switch(sortBy) {
                    case "rating":
                    case "helpful":
                    case "funny":
                    case "length":
                    case "playtime":
                        return b[sortBy] - a[sortBy];
                    case "visibility":
                        a = a[sortBy].toLowerCase();
                        b = b[sortBy].toLowerCase();
                        if (a > b) { return -1; }
                        if (a < b) { return 1; }
                        return 0;
                    case "default":
                        return a[sortBy] - b[sortBy];
                }
            });

            if (reverse) {
                displayedReviews.reverse();
            }

            displayedReviews = displayedReviews.slice(pageCount * (curPage - 1), pageCount * curPage);

            let footer = document.querySelector("#leftContents > .workshopBrowsePaging:last-child");
            for (let { node } of displayedReviews) {
                footer.insertAdjacentElement("beforebegin", HTMLParser.htmlToElement(node));
            }

            // Add back sanitized event handlers
            ExtensionLayer.runInPageContext(ids => {
                Array.from(document.querySelectorAll(".review_box")).forEach((node, boxIndex) => {
                    let id = ids[boxIndex];

                    let containers = node.querySelectorAll(".dselect_container");

                    // Only exists when the requested profile is yours (these are the input fields where you can change visibility and language of the review)
                    if (containers.length) {
                        for (let container of node.querySelectorAll(".dselect_container")) {
                            let type = container.id.startsWith("ReviewVisibility") ? "Visibility" : "Language";
                            let input = container.querySelector("input");
                            let trigger = container.querySelector(".trigger");
                            let selections = Array.from(container.querySelectorAll(".dropcontainer a"));

                            input.onchange = () => { window[`OnReview${type}Change`](id, `Review${type}${id}`) };

                            trigger.href = "javascript:DSelectNoop();"
                            trigger.onfocus = () => DSelectOnFocus(`Review${type}${id}`);
                            trigger.onblur = () => DSelectOnBlur(`Review${type}${id}`);
                            trigger.onclick = () => DSelectOnTriggerClick(`Review${type}${id}`);

                            selections.forEach((selection, selIndex) => {
                                selection.href = "javascript:DSelectNoop();";
                                selection.onmouseover = () => DHighlightItem(`Review${type}${id}`, selIndex, false);
                                selection.onclick = () => DHighlightItem(`Review${type}${id}`, selIndex, true);
                            });
                        }
                    // Otherwise you have buttons to vote for the review (Was it helpful or not, was it funny?)
                    } else {
                        let controlBlock = node.querySelector(".control_block");

                        let btns = controlBlock.querySelectorAll("a");
                        let [ upvote, downvote, funny ] = btns;

                        for (let btn of btns) {
                            btn.href = "javascript:void(0)";
                        }

                        upvote.onclick = () => UserReviewVoteUp(id);
                        downvote.onclick = () => UserReviewVoteDown(id);
                        funny.onclick = () => UserReviewVoteTag(id, 1, `RecommendationVoteTagBtn${id}_1`);
                    }
                });
            }, [ displayedReviews.map(review => review.id) ]);
        }

        Messenger.addMessageListener("updateReview", id => {
            Background.action("updatereviewnode", steamId, document.querySelector(`[id$="${id}"`).closest(".review_box").outerHTML, numReviews).then(getReviews);
        });

        ExtensionLayer.runInPageContext(() => {
            $J(document).ajaxSuccess((event, xhr, { url }) => {
                let pathname = new URL(url).pathname;
                if (pathname.startsWith("/userreviews/rate/") || pathname.startsWith("/userreviews/votetag/") || pathname.startsWith("/userreviews/update/")) {
                    let id = pathname.split('/').pop();
                    Messenger.postMessage("updateReview", id);
                }
            });
        });

        document.querySelector(".review_list h1").insertAdjacentElement("beforebegin",
            Sortbox.get("reviews", [
                ["default", Localization.str.date],
                ["rating", Localization.str.rating],
                ["helpful", Localization.str.helpful],
                ["funny", Localization.str.funny],
                ["length", Localization.str.length],
                ["visibility", Localization.str.visibility],
                ["playtime", Localization.str.playtime],
            ], SyncedStorage.get("sortreviewsby"), sortReviews, "sortreviewsby")
        );
    };

    return RecommendedPageClass;
})();

let InventoryPageClass = (function(){

    function InventoryPageClass() {
        prepareMarketForInventory();
        addInventoryGoToPage();
        /* hide_empty_inventory_tabs(); */

        let observer = new MutationObserver(() => {
            addInventoryGoToPage();
        });

        observer.observe(document.querySelector("div.games_list_tabs"), {subtree: true, attributes: true})

    }

    function setBackgroundOption(thisItem, assetId, itemActions) {
        if (!document.querySelector(".inventory_links")) { return; }
        if (itemActions.querySelector(".es_set_background")) { return; }

        let viewFullBtn = itemActions.querySelector("a");
        if (!viewFullBtn) { return; }

        if (!/public\/images\/items/.test(viewFullBtn.href)) { return; }

        let linkClass =  thisItem.classList.contains('es_isset_background') ? "btn_disabled" : "";
        HTML.afterEnd(viewFullBtn,
            `<a class="es_set_background btn_small btn_darkblue_white_innerfade ${linkClass}"><span>${Localization.str.set_as_background}</span></a>
                  <img class="es_background_loading" src="https://steamcommunity-a.akamaihd.net/public/images/login/throbber.gif">`);

        viewFullBtn.parentNode.querySelector(".es_set_background").addEventListener("click", async function(e) {
            e.preventDefault();
            let el = e.target.closest(".es_set_background");

            if (el.classList.contains("btn_disabled")) { return; }

            let loading = viewFullBtn.parentNode.querySelector(".es_background_loading");
            if (loading.classList.contains("esi-shown")) { return;}

            loading.classList.add("esi-shown");

            // Do nothing if loading or already done
            let setBackground = document.querySelector(".es_isset_background");
            if (setBackground) {
                setBackground.classList.remove("es_isset_background");
            }
            thisItem.classList.add("es_isset_background");

            let result = await RequestData.getHttp(User.profileUrl + "/edit");

            // Make sure the background we are trying to set is not set already
            let m = result.match(/SetCurrentBackground\( {\"communityitemid\":\"(\d+)\"/i);
            let currentBg = m ? m[1] : false;

            if (currentBg !== assetId) {
                let dom = HTMLParser.htmlToDOM(result);

                dom.querySelector("#profile_background").value = assetId;
                let form = dom.querySelector("#editForm");
                let formData = new FormData(form);

                RequestData.post(User.profileUrl + "/edit", formData, {withCredentials: true}).then(result => {
                    // Check if it was truly a succesful change
                    if (/"saved_changes_msg"/i.test(result)) {
                        el.classList.add("btn_disabled");
                    }
                }).catch(() => {
                    console.error("Edit background failed");
                }).finally(() => {
                    loading.classList.remove("esi-shown");
                });
            } else {
                el.classList.add("btn_disabled");
                loading.classList.remove("esi-shown");
            }
        });
    }

    async function addPriceToGifts(itemActions) {
        let action = itemActions.querySelector("a");
        if (!action) { return; }

        let giftAppid = GameId.getAppid(action.href);
        if (!giftAppid) { return; }
        // TODO: Add support for package(sub)

        let result = await Background.action("appdetails", giftAppid, "price_overview");
        if (!result || !result.success) { return; }

        let overview = result.data.price_overview;
        if (!overview) { return; }

        let discount = overview.discount_percent;
        let price = new Price(overview.final / 100, overview.currency);

        itemActions.style.display = "flex";
        itemActions.style.alignItems = "center";
        itemActions.style.justifyContent = "space-between";

        if (discount > 0) {
            let originalPrice = new Price(overview.initial / 100, overview.currency);
            HTML.beforeEnd(itemActions,
                `<div class='es_game_purchase_action' style='margin-bottom:16px'>
                    <div class='es_game_purchase_action_bg'>
                        <div class='es_discount_block es_game_purchase_discount'>
                            <div class='es_discount_pct'>-${discount}%</div>
                            <div class='es_discount_prices'>
                                <div class='es_discount_original_price'>${originalPrice}</div>
                                <div class='es_discount_final_price'>${price}</div>
                            </div>
                        </div>
                    </div>
                </div>`);
        } else {
            HTML.beforeEnd(itemActions,
                `<div class='es_game_purchase_action' style='margin-bottom:16px'>
                    <div class='es_game_purchase_action_bg'>
                        <div class='es_game_purchase_price es_price'>${price}</div>
                    </div>
                </div>`);
        }
    }

    function addOneClickGemsOption(item, appid, assetid) {
        if (!SyncedStorage.get("show1clickgoo")) { return; }

        let quickGrind = document.querySelector("#es_quickgrind");
        if (quickGrind) { quickGrind.parentNode.remove(); }

        let scrapActions = document.querySelector("#iteminfo" + item + "_item_scrap_actions");

        let divs = scrapActions.querySelectorAll("div");
        HTML.beforeBegin(divs[divs.length-1],
            `<div><a class='btn_small btn_green_white_innerfade' id='es_quickgrind'><span>${Localization.str.oneclickgoo}</span></div>`);

        // TODO: Add prompt?
        document.querySelector("#es_quickgrind").addEventListener("click", function(e) {
            ExtensionLayer.runInPageContext((appid, assetid) => {
                let rgAJAXParams = {
                    sessionid: g_sessionID,
                    appid,
                    assetid,
                    contextid: 6
                };

                let strActionURL = `${g_strProfileURL}/ajaxgetgoovalue/`;

                $J.get(strActionURL, rgAJAXParams).done(data => {
                    strActionURL = `${g_strProfileURL}/ajaxgrindintogoo/`;
                    rgAJAXParams.goo_value_expected = data.goo_value;

                    $J.post(strActionURL, rgAJAXParams).done(() => {
                        ReloadCommunityInventory();
                    });
                });
            });
        }, [ appid, assetid ]);
    }

    function makeMarketButton(id, tooltip) {
        return `<a class="item_market_action_button item_market_action_button_green" id="${id}" data-tooltip-text="${tooltip}" style="display:none">
                    <span class="item_market_action_button_edge item_market_action_button_left"></span>
                    <span class="item_market_action_button_contents"></span>
                    <span class="item_market_action_button_edge item_market_action_button_right"></span>
                </a>`;
    }

    function updateMarketButtons(assetId, priceHighValue, priceLowValue, walletCurrency) {
        let quickSell = document.getElementById("es_quicksell" + assetId);
        let instantSell = document.getElementById("es_instantsell" + assetId);
        
        // Add Quick Sell button
        if (quickSell && priceHighValue && priceHighValue > priceLowValue) {
            quickSell.dataset.price = priceHighValue;
            quickSell.querySelector(".item_market_action_button_contents").textContent = Localization.str.quick_sell.replace("__amount__", new Price(priceHighValue, Currency.currencyNumberToType(walletCurrency)));
            quickSell.style.display = "block";
        }

        // Add Instant Sell button
        if (instantSell && priceLowValue) {
            instantSell.dataset.price = priceLowValue;
            instantSell.querySelector(".item_market_action_button_contents").textContent = Localization.str.instant_sell.replace("__amount__", new Price(priceLowValue, Currency.currencyNumberToType(walletCurrency)));
            instantSell.style.display = "block";
        }
    }

    async function addQuickSellOptions(marketActions, thisItem, marketable, contextId, globalId, assetId, sessionId, walletCurrency) {
        if (!SyncedStorage.get("quickinv")) { return; }
        if (!marketable) { return; }
        if (contextId !== 6 || globalId !== 753) { return; }
        // 753 is the appid for "Steam" in the Steam Inventory
        // 6 is the context used for "Community Items"; backgrounds, emoticons and trading cards

        if (!thisItem.classList.contains("es-loading")) {
            let url = marketActions.querySelector("a").href;

            thisItem.classList.add("es-loading");

            // Add the links with no data, so we can bind actions to them, we add the data later
            let diff = SyncedStorage.get("quickinv_diff");
            HTML.beforeEnd(marketActions, makeMarketButton("es_quicksell" + assetId, Localization.str.quick_sell_desc.replace("__modifier__", diff)));
            HTML.beforeEnd(marketActions, makeMarketButton("es_instantsell" + assetId, Localization.str.instant_sell_desc));

            ExtensionLayer.runInPageContext(() => { SetupTooltips({ tooltipCSSClass: "community_tooltip" }); });

            // Check if price is stored in data
            if (thisItem.classList.contains("es-price-loaded")) {
                let priceHighValue = thisItem.dataset.priceHigh;
                let priceLowValue = thisItem.dataset.priceLow;

                updateMarketButtons(assetId, priceHighValue, priceLowValue, walletCurrency);
            } else {
                let result = await RequestData.getHttp(url);

                let m = result.match(/Market_LoadOrderSpread\( (\d+) \)/);

                if (m) {
                    let marketId = m[1];

                    let marketUrl = "https://steamcommunity.com/market/itemordershistogram?language=english&currency=" + walletCurrency + "&item_nameid=" + marketId;
                    let market = await RequestData.getJson(marketUrl);

                    let priceHigh = parseFloat(market.lowest_sell_order / 100) + parseFloat(diff);
                    let priceLow = market.highest_buy_order / 100;
                    // priceHigh.currency == priceLow.currency == Currency.customCurrency, the arithmetic here is in walletCurrency

                    if (priceHigh < 0.03) priceHigh = 0.03;

                    // Store prices as data
                    if (priceHigh > priceLow) {
                        thisItem.dataset.priceHigh = priceHigh;
                    }
                    if (market.highest_buy_order) {
                        thisItem.dataset.priceLow = priceLow;
                    }

                    // Fixes multiple buttons
                    if (document.querySelector(".item.activeInfo") === thisItem) {
                        updateMarketButtons(assetId, priceHigh, priceLow, walletCurrency);
                    }

                    thisItem.classList.add("es-price-loaded");
                }
            }
            // Loading request either succeeded or failed, no need to flag as still in progress
            thisItem.classList.remove("es-loading");
        }

        // Bind actions to "Quick Sell" and "Instant Sell" buttons

        let nodes = document.querySelectorAll("#es_quicksell" + assetId + ", #es_instantsell" + assetId);
        for (let node of nodes) {
            node.addEventListener("click", function(e) {
                e.preventDefault();

                let buttonParent = e.target.closest(".item_market_action_button[data-price]");
                if (!buttonParent) { return; }

                let sellPrice = buttonParent.dataset.price * 100;

                let buttons = document.querySelectorAll("#es_quicksell" + assetId + ", #es_instantsell" + assetId);
                for (let button of buttons) {
                    button.classList.add("btn_disabled");
                    button.style.pointerEvents = "none";
                }

                HTML.inner(
                    marketActions.querySelector("div"),
                    "<div class='es_loading' style='min-height: 66px;'><img src='https://steamcommunity-a.akamaihd.net/public/images/login/throbber.gif'><span>" + Localization.str.selling + "</div>"
                );

                ExtensionLayer.runInPageContext((sellPrice, sessionID, global_id, contextID, assetID) => {
                    Messenger.postMessage("sendFee",
                        {
                            feeInfo: CalculateFeeAmount(sellPrice, 0.10),
                            sessionID,
                            global_id,
                            contextID,
                            assetID,
                        }
                    );
                },
                [
                    sellPrice,
                    sessionId,
                    globalId,
                    contextId,
                    assetId,
                ]);
            });
        }
    }

    function getMarketOverviewHtml(node) {
        let html = '<div style="min-height:3em;margin-left:1em;">';

        if (node.dataset.lowestPrice && node.dataset.lowestPrice !== "nodata") {
            html += Localization.str.starting_at.replace("__price__", node.dataset.lowestPrice);

            if (node.dataset.dataSold) {
                html += '<br>' + Localization.str.volume_sold_last_24.replace("__sold__", node.dataset.dataSold);
            }

            if (node.dataset.cardsPrice) {
                html += '<br>' + Localization.str.avg_price_3cards.replace("__price__", node.dataset.cardsPrice);
            }
        } else {
            html += Localization.str.no_price_data;
        }

        html += '</div>';
        return html;
    }

    async function showMarketOverview(thisItem, marketActions, globalId, hashName, appid, isBooster, walletCurrencyNumber) {
        marketActions.style.display = "block";
        let firstDiv = marketActions.querySelector("div");
        if (!firstDiv) {
            firstDiv = document.createElement("div");
            marketActions.insertAdjacentElement("afterbegin", firstDiv);
        }

        // "View in market" link
        let html = '<div style="height:24px;"><a href="https://steamcommunity.com/market/listings/' + globalId + '/' + encodeURIComponent(hashName) + '">' + Localization.str.view_in_market + '</a></div>';

        // Check if price is stored in data
        if (!thisItem.dataset.lowestPrice) {
            firstDiv.innerHTML = "<img class='es_loading' src='https://steamcommunity-a.akamaihd.net/public/images/login/throbber.gif' />";

            let overviewPromise = RequestData.getJson(`https://steamcommunity.com/market/priceoverview/?currency=${walletCurrencyNumber}&appid=${globalId}&market_hash_name=${encodeURIComponent(hashName)}`);

            if (isBooster) {
                thisItem.dataset.cardsPrice = "nodata";

                try {
                    let walletCurrency = Currency.currencyNumberToType(walletCurrencyNumber);
                    let result = await Background.action("market.averagecardprice", { 'appid': appid, 'currency': walletCurrency, } );
                    thisItem.dataset.cardsPrice = new Price(result.average, walletCurrency);
                } catch (error) {
                    console.error(error);
                }
            }

            try {
                let data = await overviewPromise;

                thisItem.dataset.lowestPrice = "nodata";
                if (data && data.success) {
                    thisItem.dataset.lowestPrice = data.lowest_price || "nodata";
                    thisItem.dataset.soldVolume = data.volume;
                }
            } catch (error) {
                console.error("Couldn't load price overview from market", error);
                HTML.inner(firstDiv, html); // add market link anyway
                return;
            }
        }

        html += getMarketOverviewHtml(thisItem);

        HTML.inner(firstDiv, html);
    }

    async function addBoosterPackProgress(marketActions, item, appid) {
        HTML.afterBegin(`#iteminfo${item}_item_owner_actions`,
            `<a class="btn_small btn_grey_white_innerfade" href="https://steamcommunity.com/my/gamecards/${appid}/"><span>${Localization.str.view_badge_progress}</span></a>`);
    }

    function inventoryMarketHelper([item, marketable, globalId, hashName, assetType, assetId, sessionId, contextId, walletCurrency, ownerSteamId, restriction, expired]) {
        marketable = parseInt(marketable);
        globalId = parseInt(globalId);
        contextId = parseInt(contextId);
        restriction = parseInt(restriction);
        let isGift = assetType && /Gift/i.test(assetType);
        let isBooster = hashName && /Booster Pack/i.test(hashName);
        let ownsInventory = User.isSignedIn && (ownerSteamId === User.steamId);

        let hm;
        let appid = (hm = hashName.match(/^([0-9]+)-/)) ? hm[1] : null;

        let thisItem = document.querySelector(`[id="${globalId}_${contextId}_${assetId}"]`);
        let itemActions = document.querySelector("#iteminfo" + item + "_item_actions");
        let marketActions = document.querySelector("#iteminfo" + item + "_item_market_actions");
        marketActions.style.overflow = "hidden";

        // Set as background option
        if (ownsInventory) {
            setBackgroundOption(thisItem, assetId, itemActions);
        }

        // Show prices for gifts

        if (isGift) {
            addPriceToGifts(itemActions);
            return;
        }

        if (ownsInventory) {
            // If is a booster pack add the average price of three cards
            if (isBooster) {
                addBoosterPackProgress(marketActions, item, appid);
            }

            addOneClickGemsOption(item, appid, assetId);
            addQuickSellOptions(marketActions, thisItem, marketable, contextId, globalId, assetId, sessionId, walletCurrency);
        }

        if ((ownsInventory && restriction > 0 && !marketable && !expired && hashName !== "753-Gems") || marketable) {
            showMarketOverview(thisItem, marketActions, globalId, hashName, appid, isBooster, walletCurrency);
        }
    }

    function prepareMarketForInventory() {

        ExtensionLayer.runInPageContext(() => {

            $J(document).on("click", ".inventory_item_link, .newitem", () => {
                if (!g_ActiveInventory.selectedItem.description.market_hash_name) {
                    g_ActiveInventory.selectedItem.description.market_hash_name = g_ActiveInventory.selectedItem.description.name;
                }
                let market_expired = false;
                if (g_ActiveInventory.selectedItem.description) {
                    market_expired = g_ActiveInventory.selectedItem.description.descriptions.reduce((acc, el) => (acc || el.value === "This item can no longer be bought or sold on the Community Market."), false);
                }

                Messenger.postMessage("sendMessage", [
                    iActiveSelectView,
                    g_ActiveInventory.selectedItem.description.marketable,
                    g_ActiveInventory.appid,
                    g_ActiveInventory.selectedItem.description.market_hash_name,
                    g_ActiveInventory.selectedItem.description.type,
                    g_ActiveInventory.selectedItem.assetid,
                    g_sessionID,
                    g_ActiveInventory.selectedItem.contextid,
                    g_rgWalletInfo.wallet_currency,
                    g_ActiveInventory.m_owner.strSteamId,
                    g_ActiveInventory.selectedItem.description.market_marketable_restriction,
                    market_expired
                ]);
            });
        });
        
        Messenger.addMessageListener("sendMessage", info => { inventoryMarketHelper(info) });

        Messenger.addMessageListener("sendFee", async ({ feeInfo, sessionID, global_id, contextID, assetID }) => {
            let sellPrice = feeInfo.amount - feeInfo.fees;
            let formData = new FormData();
            formData.append("sessionid", sessionID);
            formData.append("appid", global_id);
            formData.append("contextid", contextID);
            formData.append("assetid", assetID);
            formData.append("amount", 1);
            formData.append("price", sellPrice);

            /*
            * TODO test what we need to send in request, this is original:
            * mode: "cors", // CORS to cover requests sent from http://steamcommunity.com
            * credentials: "include",
            * headers: { origin: window.location.origin },
            * referrer: window.location.origin + window.location.pathname
            */

            await RequestData.post("https://steamcommunity.com/market/sellitem/", formData, { withCredentials: true });

            document.querySelector(`#es_instantsell${assetID}`).parentNode.style.display = "none";

            let node = document.querySelector(`[id="${global_id}_${contextID}_${assetID}"]`);
            node.classList.add("btn_disabled", "activeInfo");
            node.style.pointerEvents = "none";
        });
    }

    function addInventoryGoToPage(){
        if (!SyncedStorage.get("showinvnav")) { return; }

        // todo can this be circumvented?
        DOMHelper.remove("#es_gotopage");
        DOMHelper.remove("#pagebtn_first");
        DOMHelper.remove("#pagebtn_last");
        DOMHelper.remove("#es_pagego");

        DOMHelper.insertScript({ content:
            `g_ActiveInventory.GoToPage = function(page) {
                var nPageWidth = this.m_$Inventory.children('.inventory_page:first').width();
                var iCurPage = this.m_iCurrentPage;
                var iNextPage = Math.min(Math.max(0, --page), this.m_cPages-1);
                var iPages = this.m_cPages
                var _this = this;
                if (iCurPage < iNextPage) {
                    if (iCurPage < iPages - 1) {
                        this.PrepPageTransition( nPageWidth, iCurPage, iNextPage );
                        this.m_$Inventory.css( 'left', '0' );
                        this.m_$Inventory.animate( {left: -nPageWidth}, 250, null, function() { _this.FinishPageTransition( iCurPage, iNextPage ); } );
                    }
                } else if (iCurPage > iNextPage) {
                    if (iCurPage > 0) {
                        this.PrepPageTransition( nPageWidth, iCurPage, iNextPage );
                        this.m_$Inventory.css( 'left', '-' + nPageWidth + 'px' );
                        this.m_$Inventory.animate( {left: 0}, 250, null, function() { _this.FinishPageTransition( iCurPage, iNextPage ); } );
                    }
                }
            };

            function InventoryLastPage(){
                g_ActiveInventory.GoToPage(g_ActiveInventory.m_cPages);
            }
            function InventoryFirstPage(){
                g_ActiveInventory.GoToPage(1);
            }
            function InventoryGoToPage(){
                var page = $('es_pagenumber').value;
                if (isNaN(page)) return;
                g_ActiveInventory.GoToPage(parseInt(page));
            }`
        }, "es_gotopage");

        // Go to first page
        HTML.afterEnd("#pagebtn_previous", "<a id='pagebtn_first' class='pagebtn pagecontrol_element disabled'>&lt;&lt;</a>");
        document.querySelector("#pagebtn_first").addEventListener("click", () => {
            ExtensionLayer.runInPageContext(() => { InventoryFirstPage(); });
        });

        // Go to last page
        HTML.beforeBegin("#pagebtn_next", "<a id='pagebtn_last' class='pagebtn pagecontrol_element'>&gt;&gt;</a>");
        document.querySelector("#pagebtn_last").addEventListener("click", () => {
            ExtensionLayer.runInPageContext(() => { InventoryLastPage(); });
        });

        let pageGo = document.createElement("div");
        pageGo.id = "es_pagego";
        pageGo.style.float = "left";

        // Page number box
        let pageNumber = document.createElement("input");
        pageNumber.type = "number";
        pageNumber.value="1";
        pageNumber.classList.add("filter_search_box");
        pageNumber.autocomplete = "off";
        pageNumber.placeholder = "page #";
        pageNumber.id = "es_pagenumber";
        pageNumber.style.width = "50px";
        pageNumber.min = 1;
        pageNumber.max = document.querySelector("#pagecontrol_max").textContent;

        pageGo.append(pageNumber);

        let gotoButton = document.createElement("a");
        gotoButton.textContent = Localization.str.go;
        gotoButton.id = "gotopage_btn";
        gotoButton.classList.add("pagebtn");
        gotoButton.href = "javascript:InventoryGoToPage();";
        gotoButton.style.width = "32px";
        gotoButton.style.padding = "0";
        gotoButton.style.margin = "0 6px";
        gotoButton.style.textAlign = "center";

        pageGo.append(gotoButton);

        document.querySelector("#inventory_pagecontrols").insertAdjacentElement("beforebegin", pageGo);

        let observer = new MutationObserver(mutations => {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName !== "class") { return; }
                if (!mutation.target.id) { return; }

                let id = mutation.target.id;
                if (id === "pagebtn_next") {
                    document.querySelector("#pagebtn_last").classList.toggle("disabled", mutation.target.classList.contains("disabled"));
                } else if (id === "pagebtn_previous") {
                    document.querySelector("#pagebtn_first").classList.toggle("disabled", mutation.target.classList.contains("disabled"));
                }

            });
        });
        observer.observe(document.querySelector("#pagebtn_next"), { attributes: true });
        observer.observe(document.querySelector("#pagebtn_previous"), { attributes: true });
    }

    return InventoryPageClass;
})();

let FriendsPageClass = (function(){

    function FriendsPageClass() {
        this.addSort();
        this.addFriendsInviteButton();
    }

    FriendsPageClass.prototype.addSort = function() {
        let offlineFriends = document.querySelectorAll(".friend_block_v2.persona.offline");
        if (offlineFriends.length === 0 || !document.querySelector("#manage_friends_control")) { return; }

        let friendsFetched = false;

        offlineFriends.forEach((friend, i) => friend.dataset.esSortDefault = i);

        async function sortFriends(sortBy, reversed) {
            sortBy = (sortBy === "lastonline" ? "lastonline" : "default");

            if (sortBy === "lastonline" && !friendsFetched) {
                
                friendsFetched = true;
                let data = await RequestData.getHttp("https://steamcommunity.com/my/friends/?ajax=1&l=english");
                let dom = HTMLParser.htmlToElement(data);

                for (let friend of dom.querySelectorAll(".friend_block_v2.persona.offline")) {
                    let lastOnline = friend.querySelector(".friend_last_online_text").textContent.match(/Last Online (?:(\d+) days)?(?:, )?(?:(\d+) hrs)?(?:, )?(?:(\d+) mins)? ago/);
                    let time = Infinity;
                    if (lastOnline) {
                        let days = parseInt(lastOnline[1]) || 0;
                        let hours = parseInt(lastOnline[2]) || 0;
                        let minutes = parseInt(lastOnline[3]) || 0;
                        let downtime = (days * 24 + hours) * 60 + minutes;
                        time = downtime;
                    }
                    document.querySelector(`.friend_block_v2.persona.offline[data-steamid="${friend.dataset.steamid}"]`).dataset.esSortTime = time;
                }
            }

            let offlineBlock = document.querySelector("#state_offline");
            let curOfflineFriends = Array.from(document.querySelectorAll(".friend_block_v2.persona.offline"));

            let property = `esSort${sortBy === "default" ? "Default" : "Time"}`;
            curOfflineFriends.sort((a, b) => Number(a.dataset[property]) - Number(b.dataset[property]));

            for (let friend of curOfflineFriends) {
                if (reversed) {
                    offlineBlock.insertAdjacentElement("afterend", friend);
                } else {
                    offlineBlock.parentElement.appendChild(friend);
                }
            }
        }

        let sortBy = SyncedStorage.get("sortfriendsby");
        document.querySelector("#manage_friends_control").insertAdjacentElement("beforebegin", Sortbox.get(
            "friends",
            [["default", Localization.str.theworddefault], ["lastonline", Localization.str.lastonline]],
            sortBy,
            sortFriends,
            "sortfriendsby")
        );
    };

    FriendsPageClass.prototype.addFriendsInviteButton = async function() {
        let params = new URLSearchParams(window.location.search);
        if (!params.has("invitegid")) { return; }

        HTML.afterBegin("#manage_friends > div:nth-child(2)", `<span class="manage_action btnv6_lightblue_blue btn_medium" id="invitetogroup"><span>${Localization.str.invite_to_group}</span></span>`);
        ExtensionLayer.runInPageContext(groupId => {
            ToggleManageFriends();
            $J("#invitetogroup").on("click", () => {
                let friends = GetCheckedAccounts("#search_results > .selectable.selected:visible");
                InviteUserToGroup(null, groupId, friends);
            });
        }, [ params.get("invitegid") ]);
    };

    return FriendsPageClass;
})();

class GroupsPageClass {

    constructor() {
        this._groups = Array.from(document.querySelectorAll(".group_block"));
        this._initSort = true;

        this._moveSearchBar();
        this._addSort();
        this._addManageBtn();
    }

    _moveSearchBar() {
        // move the search bar to the same position as on friends page
        let container = HTML.wrap("#search_text_box", '<div class="searchBarContainer"></div>');
        document.querySelector("#search_results").insertAdjacentElement("beforebegin", container);
    }

    _addSort() {
        document.querySelector("span.profile_groups.title").insertAdjacentElement("afterend", Sortbox.get(
            "groups",
            [
                ["default", Localization.str.theworddefault],
                ["members", Localization.str.members],
                ["names", Localization.str.name]
            ],
            SyncedStorage.get("sortgroupsby"),
            (sortBy, reversed) => { this._sortGroups(sortBy, reversed) },
            "sortgroupsby")
        );

        let sortbox = document.querySelector("div.es-sortbox");
        sortbox.style.flexGrow = "2";
        sortbox.style.marginRight = "20px";
        sortbox.style.marginTop = "0";
        sortbox.style.textAlign = "right";
    }

    _getSortFunc(sortBy) {
        let property = `esSort${sortBy}`;
        switch(sortBy) {
            case "default":
                return (a, b) => Number(a.dataset[property]) - Number(b.dataset[property]);
            case "members":
                return (a, b) => Number(b.dataset[property]) - Number(a.dataset[property]);
            case "names":
                return (a, b) => a.dataset[property].localeCompare(b.dataset[property]);
        }
    }

    _sortGroups(sortBy, reversed) {
        if (this._groups.length === 0) { return; }

        if (this._initSort) {

            let i = 0;
            for (let group of this._groups) {
                let name = group.querySelector(".groupTitle > a").textContent;
                let membercount = Number(group.querySelector(".memberRow > a").textContent.match(/\d+/g).join(""));
                group.dataset.esSortdefault = i.toString();
                group.dataset.esSortnames = name;
                group.dataset.esSortmembers = membercount.toString();
                i++;
            }

            this._initSort = false;
        }

        this._groups.sort(this._getSortFunc(sortBy, `esSort${sortBy}`));

        let searchResults = document.querySelector("#search_results_empty");
        for (let group of this._groups) {
            if (reversed) {
                searchResults.insertAdjacentElement("afterend", group);
            } else {
                searchResults.parentElement.appendChild(group);
            }
        }
    }

    _addManageBtn() {
        if (this._groups.length === 0) { return; }
        if (!this._groups[0].querySelector(".actions")) { return; }

        let groupsStr = Localization.str.groups;

        HTML.beforeEnd(".title_bar", 
            `<button id="manage_friends_control" class="profile_friends manage_link btnv6_blue_hoverfade btn_medium btn_uppercase">
                <span>${groupsStr.manage_groups}</span>
            </button>`);

        HTML.afterEnd(".title_bar",
            `<div id="manage_friends" class="manage_friends_panel">
                <div class="row">${groupsStr.action_groups}
                    <span class="row">
                        <span class="dimmed">${groupsStr.select}</span>
                        <span class="selection_type" id="es_select_all">${Localization.str.all}</span>
                        <span class="selection_type" id="es_select_none">${Localization.str.none}</span>
                        <span class="selection_type" id="es_select_inverse">${Localization.str.inverse}</span>
                    </span>
                </div>
                <div class="row">
                    <span class="manage_action anage_action btnv6_lightblue_blue btn_medium btn_uppercase" id="es_leave_groups">
                        <span>${groupsStr.leave}</span>
                    </span>
                    <span id="selected_msg_err" class="selected_msg error hidden"></span>
                    <span id="selected_msg" class="selected_msg hidden">${groupsStr.selected.replace("__n__", `<span id="selected_count"></span>`)}</span>
                </div>
                <div class="row"></div>
            </div>`);

        for (let group of this._groups) {
            group.classList.add("selectable");
            HTML.afterBegin(group, 
                `<div class="indicator select_friend">
                    <input class="select_friend_checkbox" type="checkbox">
                </div>`);
            group.querySelector(".select_friend").addEventListener("click", () => {
                group.classList.toggle("selected");
                group.querySelector(".select_friend_checkbox").checked = group.classList.contains("selected");
                ExtensionLayer.runInPageContext(() => { UpdateSelection(); });
            });    
        }

        document.querySelector("#manage_friends_control").addEventListener("click", () => {
            ExtensionLayer.runInPageContext(() => { ToggleManageFriends(); });
        });

        document.querySelector("#es_select_all").addEventListener("click", () => {
            ExtensionLayer.runInPageContext(() => { SelectAll(); });
        });

        document.querySelector("#es_select_none").addEventListener("click", () => {
            ExtensionLayer.runInPageContext(() => { SelectNone(); });
        });

        document.querySelector("#es_select_inverse").addEventListener("click", () => {
            ExtensionLayer.runInPageContext(() => { SelectInverse(); });
        });

        document.querySelector("#es_leave_groups").addEventListener("click", () => this._leaveGroups());
    };

    async _leaveGroups() {
        let selected = [];

        for (let group of this._groups) {
            if (!group.classList.contains("selected")) {
                continue;
            }

            let actions = group.querySelector(".actions");
            let admin = actions.querySelector("[href*='/edit']");
            let split = actions.querySelector("[onclick*=ConfirmLeaveGroup]")
                .getAttribute("onclick").split(/'|"/);
            let id = split[1];

            if (admin) {
                let name = split[3];

                let body = Localization.str.groups.leave_admin_confirm.replace("__name__", `<a href=\\"/gid/${id}\\" target=\\"_blank\\">${name}</a>`);
                let result = await ConfirmDialog.open(Localization.str.groups.leave, body);
                let cont = (result === "OK");
                if (!cont) {
                    group.querySelector(".select_friend").click();
                    continue;
                }
            }

            selected.push([id, group]);
        }

        if (selected.length > 0) {
            let body = Localization.str.groups.leave_groups_confirm.replace("__n__", selected.length);
            let result = await ConfirmDialog.open(Localization.str.groups.leave, body);

            if (result === "OK") {
                for (let tuple of selected) {
                    let [id, group] = tuple;
                    let res = await this._leaveGroup(id).catch(err => console.error(err));

                    if (!res || !res.success) {
                        console.error("Failed to leave group " + id);
                        continue;
                    }

                    group.style.opacity = "0.3";
                    group.querySelector(".select_friend").click();
                }
            }
        }
    }

    _leaveGroup(id) {
        let formData = new FormData();
        formData.append("sessionid", User.getSessionId());
        formData.append("steamid", User.steamId);
        formData.append("ajax", 1);
        formData.append("action", "leave_group");
        formData.append("steamids[]", id);

        return RequestData.post(User.profileUrl + "/friends/action", formData, {
            withCredentials: true
        }, "json");
    }
}

let MarketListingPageClass = (function(){

    function MarketListingPageClass() {
        this.appid = GameId.getAppid(window.location.href);

        if (this.appid) {
            this.addSoldAmountLastDay();
            this.addBackgroundPreviewLink();
        }

        this.addBadgePageLink();
        this.addPriceHistoryZoomControl();
    }

    MarketListingPageClass.prototype.addSoldAmountLastDay = async function() {
        let country = User.country;
        let currencyNumber = Currency.currencyTypeToNumber(Currency.storeCurrency);

        let link = DOMHelper.selectLastNode(document, ".market_listing_nav a").href;
        let marketHashName = (link.match(/\/\d+\/(.+)$/) || [])[1];

        let data = await RequestData.getJson(`https://steamcommunity.com/market/priceoverview/?appid=${this.appid}&country=${country}&currency=${currencyNumber}&market_hash_name=${marketHashName}`);
        if (!data.success) { return; }

        let soldHtml =
            `<div class="es_sold_amount">
                ${Localization.str.sold_last_24.replace(`__sold__`, `<span class="market_commodity_orders_header_promote">${data.volume || 0}</span>`)}
            </div>`;

        HTML.beforeBegin(".market_commodity_buy_button", soldHtml);

        /* TODO where is this observer applied?
        let observer = new MutationObserver(function(){
            if (!document.querySelector("#pricehistory .es_sold_amount")) {
                document.querySelector(".jqplot-title").insertAdjacentHTML("beforeend", soldHtml);
            }
            return true;
        });
        observer.observe(document, {}); // .jqplot-event-canvas
        */
    };

    MarketListingPageClass.prototype.addBadgePageLink = function() {
        let gameAppId = parseInt((document.URL.match("\/753\/([0-9]+)-") || [0, 0])[1]);
        let cardType = document.URL.match("Foil(%20Trading%20Card)?%29") ? "?border=1" : "";
        if (!gameAppId || gameAppId === 753) { return; }

        HTML.beforeEnd("div.market_listing_nav",
        `<a class="btn_grey_grey btn_medium" href="https://steamcommunity.com/my/gamecards/${gameAppId + cardType}" style="float: right; margin-top: -10px;" target="_blank">
                <span>
                    <img src="https://store.steampowered.com/public/images/v6/ico/ico_cards.png" style="margin: 7px 0;" width="24" height="16" border="0" align="top">
                    ${Localization.str.view_badge}
                </span>
            </a>`);
    };

    MarketListingPageClass.prototype.addBackgroundPreviewLink = function() {
        if (this.appid !== 753) { return; }

        let viewFullLink = document.querySelector("#largeiteminfo_item_actions a");
        if (!viewFullLink) { return; }

        let bgLink = viewFullLink.href.match(/images\/items\/(\d+)\/([a-z0-9.]+)/i);
        if (bgLink) {
            HTML.afterEnd(viewFullLink,
                `<a class="es_preview_background btn_small btn_darkblue_white_innerfade" target="_blank" href="${User.profileUrl}#previewBackground/${bgLink[1]}/${bgLink[2]}">
                    <span>${Localization.str.preview_background}</span>
                </a>`);
        }
    };

    MarketListingPageClass.prototype.addPriceHistoryZoomControl = function() {
        HTML.afterEnd(document.querySelectorAll(".zoomopt")[1], `<a class="zoomopt as-zoomcontrol">${Localization.str.year}</a>`);
        document.querySelector(".as-zoomcontrol").addEventListener("click", function() {
            ExtensionLayer.runInPageContext(() => {
                pricehistory_zoomDays(g_plotPriceHistory, g_timePriceHistoryEarliest, g_timePriceHistoryLatest, 365);
            });
        });
    };

    return MarketListingPageClass;
})();

let MarketPageClass = (function(){

    function MarketPageClass() {

        this.highlightMarketItems();

        let that = this;
        let observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                for (let node of mutation.addedNodes) {
                    if (node.classList && node.classList.contains("market_listing_row_link")) {
                        that.highlightMarketItems();
                        return;
                    }
                }
            });
        });

        observer.observe(
            document.querySelector("#mainContents"),
            {childList: true, subtree: true}
        );

        // TODO shouldn't this be global? Do we want to run on other pages?
        if (window.location.pathname.match(/^\/market\/$/)) {
            this.addMarketStats();
            this.minimizeActiveListings();
            this.addSort();
            this.marketPopularRefreshToggle();
            this.addLowestMarketPrice();
        }

    }

    async function loadMarketStats() {
        let { startListing, purchaseTotal, saleTotal } = LocalStorage.get("market_stats", { startListing: null, purchaseTotal: 0, saleTotal: 0 });
        let curStartListing = null;
        let transactions = new Set();
        let stop = false;

        // If startListing is missing, reset cached data to avoid inaccurate results.
        if (startListing === null && (purchaseTotal > 0 || saleTotal > 0)) {
            purchaseTotal = 0;
            saleTotal = 0;
        }

        function updatePrices(dom, start) {

            let nodes = dom.querySelectorAll(".market_listing_row");
            for (let node of nodes) {
                if (node.id) {
                    if (transactions.has(node.id)) {
                        // Duplicate transaction, don't count in totals twice.
                        continue;
                    } else {
                        transactions.add(node.id);
                    }
                } else {
                    console.error('Could not find id of transaction', node);
                }
                let type = node.querySelector(".market_listing_gainorloss").textContent;
                let isPurchase;
                if (type.includes("+")) {
                    isPurchase = true;
                } else if (type.includes("-")) {
                    isPurchase = false;
                } else {
                    continue;
                }
                if (!curStartListing && start === 0) {
                    curStartListing = node.id;
                }
                // If reached cached data, then stop.
                if (node.id === startListing) {
                    stop = true;
                    break;
                }

                let priceNode = node.querySelector(".market_listing_price");
                if (!priceNode) { continue; }

                let price = Price.parseFromString(priceNode.textContent);

                if (isPurchase) {
                    purchaseTotal += price.value;
                } else {
                    saleTotal += price.value;
                }
            }

            let net = new Price(saleTotal - purchaseTotal);
            let color = "green";
            let netText = Localization.str.net_gain;
            if (net.value < 0) {
                color = "red";
                netText = Localization.str.net_spent;
            }

            let purchaseTotalPrice = new Price(purchaseTotal);
            let saleTotalPrice = new Price(saleTotal);
            HTML.inner(
                "#es_market_summary",
                `<div>${Localization.str.purchase_total} <span class='es_market_summary_item'>${purchaseTotalPrice}</span></div>
                <div>${Localization.str.sales_total} <span class='es_market_summary_item'>${saleTotalPrice}</span></div>
                <div>${netText}<span class='es_market_summary_item' style="color:${color}">${net}</span></div>`
            );
        }

        const pageSize = 500;
        let pages = -1;
        let currentPage = 0;
        let totalCount = null;
        let pageRequests = [];
        let failedRequests = 0;

        let progressNode = document.querySelector("#esi_market_stats_progress");
        let url = new URL("/market/myhistory/render/", "https://steamcommunity.com/");
        url.searchParams.set('count', pageSize);

        async function nextRequest() {
            let request = pageRequests.shift();
            url.searchParams.set('start', request.start);
            request.attempt += 1;
            request.lastAttempt = Date.now();
            if (request.attempt > 1) {
                await sleep(2000);
            } else if (request.attempt > 4) {
                // Give up after four tries
                throw new Error("Could not retrieve market transactions.");
            }
            
            let data = await RequestData.getJson(url.toString());
            let dom = HTMLParser.htmlToDOM(data.results_html);

            // Request may fail with results_html == "\t\t\t\t\t\t<div class=\"market_listing_table_message\">There was an error loading your market history. Please try again later.</div>\r\n\t"
            let message = dom.querySelector('.market_listing_table_message');
            if (message && message.textContent.includes("try again later")) {
                pageRequests.push(request);
                failedRequests += 1;
                return;
            }
            
            updatePrices(dom, request.start);

            return data.total_count;
        }

        try {
            pageRequests.push({ 'start': 0, 'attempt': 0, 'lastAttempt': 0, });
            while (pageRequests.length > 0 && !stop) {
                let t = await nextRequest();
                if (pages < 0 && t > 0) {
                    totalCount = t;
                    pages = Math.ceil(totalCount / pageSize);
                    for (let start = pageSize; start < totalCount; start += pageSize) {
                        pageRequests.push({ 'start': start, 'attempt': 0, 'lastAttempt': 0, });
                    }
                }

                progressNode.textContent = `${++currentPage}${failedRequests > 0 ? -failedRequests : ''}/${pages < 0 ? "?" : pages} (${transactions.size}/${totalCount})`;
            }
        } catch (err) {
            failedRequests += 1;
            console.error(err);
        }

        if (failedRequests === 0) {
            progressNode.textContent = '';
            LocalStorage.set("market_stats", { startListing: curStartListing, purchaseTotal, saleTotal });
            return true;
        }

        progressNode.textContent = Localization.str.transactionStatus.replace("__failed__", failedRequests).replace("__size__", transactions.size).replace("__total__", totalCount);
        return false;
    }

    MarketPageClass.prototype.addMarketStats = async function() {
        if (!User.isSignedIn) { return; }

        HTML.beforeBegin("#findItems",
                `<div id="es_summary">
                    <div class="market_search_sidebar_contents">
                        <h2 class="market_section_title">${Localization.str.market_transactions}</h2>
                        <div id="es_market_summary_status"></div>
                        <div class="market_search_game_button_group" id="es_market_summary" style="display:none;"></div>
                    </div>
                </div>`);

        let node = document.querySelector("#es_market_summary_status");
        HTML.inner(node, `<a class="btnv6_grey_black ico_hover btn_small_thin" id="es_market_summary_button"><span>${Localization.str.load_market_stats}</span></a>`);

        async function startLoadingStats() {
            HTML.inner(node, `<img id="es_market_summary_throbber" src="https://steamcommunity-a.akamaihd.net/public/images/login/throbber.gif">
                                <span><span id="esi_market_stats_progress_description">${Localization.str.loading} </span><span id="esi_market_stats_progress"></span>
                              </span>`);
            document.querySelector("#es_market_summary").style.display = null;
            let success = await loadMarketStats();
            if (node && success) {
                node.remove();
                // node.style.display = "none";
            } else {
                let el = document.getElementById('es_market_summary_throbber');
                if (el) el.remove();
                el = document.getElementById('esi_market_stats_progress_description');
                if (el) el.remove();
            }
        }

        document.querySelector("#es_market_summary_button").addEventListener("click", startLoadingStats);

        if (SyncedStorage.get("showmarkettotal")) {
            startLoadingStats();
        }
    };

    // Hide active listings on Market homepage
    MarketPageClass.prototype.minimizeActiveListings = function() {
        if (!SyncedStorage.get("hideactivelistings")) { return; }

        document.querySelector("#tabContentsMyListings").style.display = "none";
        let node = document.querySelector("#tabMyListings");
        node.classList.remove("market_tab_well_tab_active");
        node.classList.add("market_tab_well_tab_inactive");
    };

    // Show the lowest market price for items you're selling
    MarketPageClass.prototype.addLowestMarketPrice = function() {
        if (!User.isSignedIn || !SyncedStorage.get("showlowestmarketprice") || SyncedStorage.get("hideactivelistings")) { return; }

        let country = User.country;
        let currencyNumber = Currency.currencyTypeToNumber(Currency.storeCurrency);

        let loadedMarketPrices = {};

        let observer = new MutationObserver(function(){
            insertPrices();
        });

        observer.observe(document.getElementById("tabContentsMyActiveMarketListingsRows"), {childList: true});

        function insertPrice(node, data) {
            node.classList.add("es_priced");

            let lowestNode = node.querySelector(".market_listing_es_lowest");
            lowestNode.textContent = data['lowest_price'];

            let myPrice = Price.parseFromString(node.querySelector(".market_listing_price span span").textContent);
            let lowPrice = Price.parseFromString(data['lowest_price']);

            if (myPrice.value <= lowPrice.value) {
                lowestNode.classList.add("es_percentage_lower"); // Ours matches the lowest price
            } else {
                lowestNode.classList.add("es_percentage_higher"); // Our price is higher than the lowest price
            }
        }

        let parentNode = document.querySelector("#tabContentsMyListings");

        // update tables' headers
        let nodes = parentNode.querySelectorAll("#my_market_listingsonhold_number,#my_market_selllistings_number");
        for (let node of nodes) {
            let listingNode = node.closest(".my_listing_section");
            if (listingNode.classList.contains("es_selling")) { continue; }
            listingNode.classList.add("es_selling");

            let headerNode = listingNode.querySelector(".market_listing_table_header span");
            if (!headerNode) { continue; }

            headerNode.style.width = "200px"; // TODO do we still need to change width?
            HTML.afterEnd(headerNode,
                    "<span class='market_listing_right_cell market_listing_my_price'><span class='es_market_lowest_button'>" + Localization.str.lowest + "</span></span>");
        }

        insertPrices();

        async function insertPrices() {

            // update table rows
            let rows = [];
            nodes = parentNode.querySelectorAll(".es_selling .market_listing_row");
            for (let node of nodes) {
                if (node.querySelector(".market_listing_es_lowest")) { continue; }
                let button = node.querySelector(".market_listing_edit_buttons");
                button.style.width = "200px"; // TODO do we still need to change width?

                HTML.afterEnd(node.querySelector(".market_listing_edit_buttons"),
                    "<div class='market_listing_right_cell market_listing_my_price market_listing_es_lowest'>&nbsp;</div>");

                // we do this because of changed width, right?
                let actualButton = node.querySelector(".market_listing_edit_buttons.actual_content");
                actualButton.style.width = "inherit";
                button.append(actualButton);

                rows.push(node);
            }

            for (let node of rows) {
                let linkNode = node.querySelector(".market_listing_item_name_link");
                if (!linkNode) { continue; }

                let m = linkNode.href.match(/\/(\d+)\/(.+)$/);
                if (!m) { continue; }
                let appid = parseInt(m[1]);
                let marketHashName = m[2];

                let allowInsert = true;

                let priceData;
                let done;
                if (loadedMarketPrices[marketHashName]) {
                    priceData = loadedMarketPrices[marketHashName];
                } else {
                    do {
                        try {
                            let data = await RequestData.getJson(`https://steamcommunity.com/market/priceoverview/?country=${country}&currency=${currencyNumber}&appid=${appid}&market_hash_name=${marketHashName}`);

                            await sleep(1000);

                            done = true;
                            loadedMarketPrices[marketHashName] = data;
                            priceData = data;
                        } catch(err) {
                            // Too Many Requests
                            if (err instanceof HTTPError && err.code === 429) {
                                await sleep(30000);
                                if (node) {
                                    done = false;
                                } else {
                                    return;
                                }
                            } else {
                                console.error("Failed to retrieve price overview for item %s!", marketHashName);
                                allowInsert = false;
                                break;
                            }
                            
                        }
                    } while (!done);
                }

                if (allowInsert) {
                    insertPrice(node, priceData);
                }
            }
        }

    };

    MarketPageClass.prototype.addSort = function() {

        let container = document.querySelector("#tabContentsMyActiveMarketListingsTable");
        if (!container || !container.querySelector(".market_listing_table_header")) { return; }

        // Indicate default sort and add buttons to header
        function buildButtons() {
            if (document.querySelector(".es_marketsort")) { return; }

            // name
            DOMHelper.wrap(
                HTMLParser.htmlToElement("<span id='es_marketsort_name' class='es_marketsort market_sortable_column'></span>"),
                DOMHelper.selectLastNode(container, ".market_listing_table_header span").parentNode
            );

            // date
            let node = container.querySelector(".market_listing_table_header .market_listing_listed_date");
            node.classList.add("market_sortable_column");

            DOMHelper.wrap(
                HTMLParser.htmlToElement("<span id='es_marketsort_date' class='es_marketsort active asc'></span>"),
                node
            );

            // price
            node = DOMHelper.selectLastNode(container, ".market_listing_table_header .market_listing_my_price");
            node.classList.add("market_sortable_column");

            DOMHelper.wrap(
                HTMLParser.htmlToElement("<span id='es_marketsort_price' class='es_marketsort'></span>"),
                node
            );

            HTML.beforeBegin("#es_marketsort_name",
                "<span id='es_marketsort_game' class='es_marketsort market_sortable_column'><span>" + Localization.str.game_name.toUpperCase() + "</span></span>");
        }

        buildButtons();

        // add header click handlers
        let tableHeader = container.querySelector(".market_listing_table_header");
        if (!tableHeader) { return; }

        tableHeader.addEventListener("click", function(e) {
            let sortNode = e.target.closest(".es_marketsort");
            if (!sortNode) { return; }

            let isAsc = sortNode.classList.contains("asc");

            document.querySelector(".es_marketsort.active").classList.remove("active");

            sortNode.classList.add("active");
            sortNode.classList.toggle("asc", !isAsc);
            sortNode.classList.toggle("desc", isAsc);

            // set default position
            if (!container.querySelector(".market_listing_row[data-esi-default-position]")) {
                let nodes = container.querySelectorAll(".market_listing_row");
                let i = 0;
                for (let node of nodes) {
                    node.dataset.esiDefaultPosition = i++;
                }
            }

            sortRows(sortNode.id, isAsc);
        });

        container.addEventListener("click", function(e) {
            if (!e.target.closest(".market_paging_controls span")) { return; }
            document.querySelector(".es_marketsort.active").classList.remove("active");

            let dateNode = document.querySelector("#es_marketsort_date");
            dateNode.classList.remove("desc");
            dateNode.classList.add("active asc")
        });

        function sortRows(sortBy, asc) {
            let selector;
            let dataname;
            let isNumber = false;
            switch (sortBy) {
                case "es_marketsort_name":
                    selector = ".market_listing_item_name";
                    break;
                case "es_marketsort_date":
                    dataname = "esiDefaultPosition";
                    isNumber = true;
                    break;
                case "es_marketsort_price":
                    selector = ".market_listing_price";
                    break;
                case "es_marketsort_game":
                    selector = ".market_listing_game_name";
                    break;
            }

            let rows = [];
            let nodes = container.querySelectorAll(".market_listing_row");
            for (let node of nodes) {
                let value;
                if (selector) {
                    value = node.querySelector(selector).textContent.trim();
                } else {
                    value = node.dataset[dataname];
                }

                if (isNumber) {
                    value = parseInt(value);
                }

                rows.push([value, node]);
            }

            let s = (asc === true) ? 1 : -1;
            rows.sort(function(a,b) {
                if (a[0] === b[0]) { return 0;}
                if (isNumber) {
                    return asc ? b[0] - a[0] : a[0] - b[0];
                }

                return a[0] < b[0] ? s : -s;
            });

            for (let row of rows) {
                container.append(row[1]);
            }
        }

        /* TODO when do we need this?
        let observer = new MutationObserver(buildButtons);
        observer.observe(document.querySelector("#tabContentsMyActiveMarketListingsTable"), {childList: true, subtree: true});
        */
    };

    MarketPageClass.prototype.marketPopularRefreshToggle = function() {
        HTML.beforeEnd("#sellListings .market_tab_well_tabs",
            `<div id="es_popular_refresh_toggle" class="btn_grey_black btn_small" data-tooltip-text="${Localization.str.market_popular_items_toggle}"></div>`);

        document.querySelector("#es_popular_refresh_toggle").addEventListener("click", function(e) {
            toggleRefresh(!LocalStorage.get("popular_refresh"));
        });

        toggleRefresh(LocalStorage.get("popular_refresh", false));

        ExtensionLayer.runInPageContext(() => { SetupTooltips({ tooltipCSSClass: "community_tooltip" }); });

        function toggleRefresh(state) {
            document.querySelector("#es_popular_refresh_toggle").classList.toggle("es_refresh_off", !state);
            LocalStorage.set("popular_refresh", state);
            ExtensionLayer.runInPageContext(state => { g_bMarketWindowHidden = state; }, [ state ]);
        }
    };

    MarketPageClass.prototype.highlightMarketItems = async function() {
        if (!SyncedStorage.get("highlight_owned")) { return; }

        let nodes = document.querySelectorAll(".market_listing_row_link");
        for (let node of nodes) {
            let m = node.href.match(/market\/listings\/753\/(.+?)(\?|$)/);
            if (!m) { continue; }

            // todo Collect hashes and query them all at once
            if (await Inventory.hasInInventory6(decodeURIComponent(m[1]))) {
                Highlights.highlightOwned(node.querySelector("div"));
            }
        }
    };

    return MarketPageClass;
})();

let CommunityAppPageClass = (function(){

    function CommunityAppPageClass() {
        this.appid = GameId.getAppid(window.location.href);

        Highlights.addTitleHighlight(this.appid);

        this.addLinks();
        this.addAppPageWishlist();
        AgeCheck.sendVerification();

        let node = document.querySelector(".apphub_background");
        if (node) {
            let observer = new MutationObserver(() => {
                AgeCheck.sendVerification();
            });
            observer.observe(node, {attributes: true}); // display changes to none if age gate is shown
        }
    }

    CommunityAppPageClass.prototype.addAppPageWishlist = async function() {
        if (!User.isSignedIn || !SyncedStorage.get("wlbuttoncommunityapp")) { return; }
        await DynamicStore;

        let { owned, wishlisted } = await DynamicStore.getAppStatus(`app/${this.appid}`);
        if (owned) { return; }

        let inactiveStyle = "";
        let activeStyle = "display: none;";

        if (wishlisted) {
            inactiveStyle = "display: none;";
            activeStyle = "";
        }

        let parent = document.querySelector(".apphub_OtherSiteInfo");
        HTML.beforeEnd(parent,
            ` <a id="es_wishlist_add" class="btnv6_blue_hoverfade btn_medium" style="${inactiveStyle}">
                  <span>
                      <img class="es-loading-wl" src="//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif" style="display: none;">
                      ${Localization.str.add_to_wishlist}
                  </span>
              </a>
              <a id="es_wishlist_success" class="btnv6_blue_hoverfade btn_medium" style="${activeStyle}">
                  <span>
                      <img class="es-remove-wl" src="${ExtensionResources.getURL("img/remove.png")}" style="display: none;">
                      <img class="es-loading-wl" src="//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif" style="display: none;">
                      <img class="es-in-wl" src="//steamstore-a.akamaihd.net/public/images/v6/ico/ico_selected.png" border="0">
                      ${Localization.str.on_wishlist}
                  </span>
              </a>
              <div id="es_wishlist_fail" style="display: none;">
                  <b>${Localization.str.error}</b>
              </div>`);

        let addBtn = document.getElementById("es_wishlist_add");
        let successBtn = document.getElementById("es_wishlist_success");
        let failNode = document.getElementById("es_wishlist_fail");

        addBtn.addEventListener("click", handler);
        successBtn.addEventListener("click", handler);

        let that = this;
        async function handler(e) {
            e.preventDefault();

            if (parent.classList.contains("loading")) { return; }
            parent.classList.add("loading");
            failNode.style.display = "none";

            wishlisted = this === successBtn;
            let action = wishlisted ? "wishlist.remove" : "wishlist.add";

            try {
                await Background.action(action, that.appid);
                
                successBtn.style.display = wishlisted ? "none" : "";
                addBtn.style.display = wishlisted ? "" : "none";

                DynamicStore.clear();
            } catch(err) {
                /* We can't (easily) detect whether or not the user is logged in to the store,
                   therefore we're also not able to provide more details here */
                console.error("Failed to add to/remove from wishlist");
                failNode.style.display = "block";
            } finally {
                parent.classList.remove("loading");
            }
        }
    };

    function makeHeaderLink(cls, url, str) {
        return ` <a class="btnv6_blue_hoverfade btn_medium ${cls}" target="_blank" href="${url}">
                   <span><i class="ico16"></i>&nbsp;${str}</span>
               </a>`;
    }

    CommunityAppPageClass.prototype.addLinks = function() {
        let node = document.querySelector(".apphub_OtherSiteInfo");

        if (SyncedStorage.get("showsteamdb")) {
            HTML.beforeEnd(node, makeHeaderLink(
                "steamdb_ico",
                `https://steamdb.info/app/${this.appid}/`,
                "SteamDB"));
        }

        if (SyncedStorage.get("showitadlinks")) {
            HTML.beforeEnd(node, makeHeaderLink(
                "itad_ico",
                `https://isthereanydeal.com/steam/app/${this.appid}/`,
                "ITAD"));
        }

        if (SyncedStorage.get("showbartervg")) {
            HTML.beforeEnd(node, makeHeaderLink(
                "bartervg_ico",
                `https://barter.vg/steam/app/${this.appid}/`,
                "Barter.vg"));
        }
    };

    return CommunityAppPageClass;
})();

let GuidesPageClass = (function(){

    let Super = CommunityAppPageClass;

    function GuidesPageClass() {
        Super.call(this);

        this.removeGuidesLanguageFilter();
    }

    GuidesPageClass.prototype = Object.create(Super.prototype);
    GuidesPageClass.prototype.constructor = GuidesPageClass;

    GuidesPageClass.prototype.removeGuidesLanguageFilter = function() {
        if (!SyncedStorage.get("removeguideslanguagefilter")) { return; }

        let nodes = document.querySelectorAll("#rightContents .browseOption");
        for (let node of nodes) {
            let onclick = node.getAttribute("onclick");

            let linkNode = node.querySelector("a");
            linkNode.href = linkNode.href.replace(/requiredtags[^&]+/, "requiredtags[]=-1");

            if (onclick) {
                let url = linkNode.href;
                node.removeAttribute("onclick");
                node.addEventListener("click", function() {
                    window.location.href = url;
                });
            }
        }

        nodes = document.querySelectorAll(".guides_home_view_all_link > a, .guide_home_category_selection");
        for (let node of nodes) {
            node.href = node.href.replace(/&requiredtags[^&]+$/, "");
        }
    };

    return GuidesPageClass;
})();

class MyWorkshopClass {
    constructor() {
        MyWorkshopClass.addFileSizes();
        MyWorkshopClass.addTotalSizeButton();
    }

    static getFileSizeStr(size) {
        let units = ["TB", "GB", "MB", "KB"];

        let index = units.findIndex((unit, i) =>
            size / Math.pow(1000, units.length - (i + 1)) >= 1
        );
        return `${(size / Math.pow(1000, units.length - (index + 1))).toFixed(2)} ${units[index]}`;
    }

    static async addFileSizes() {
        for (let node of document.querySelectorAll(".workshopItemSubscription[id*=Subscription]")) {
            if (node.classList.contains("sized")) { continue; }
            
            let id = node.id.replace("Subscription", "");
            let size = await Background.action("workshopfilesize", id, true);
            if (typeof size !== "number") { continue; }

            let str = Localization.str.calc_workshop_size.file_size.replace("__size__", MyWorkshopClass.getFileSizeStr(size));
            let details = node.querySelector(".workshopItemSubscriptionDetails");
            HTML.beforeEnd(details, `<div class="workshopItemDate">${str}</div>`)
            node.classList.add("sized");
        }
    }

    static addTotalSizeButton() {
        let url = new URL(window.location.href);
        if (!url.searchParams || url.searchParams.get("browsefilter") !== "mysubscriptions") { return; }

        let panel = document.querySelector(".primary_panel");
        HTML.beforeEnd(panel,
            `<div class="menu_panel">
                <div class="rightSectionHolder">
                    <div class="rightDetailsBlock">
                        <span class="btn_grey_steamui btn_medium" id="es_calc_size">
                            <span>${Localization.str.calc_workshop_size.calc_size}</span>
                        </span>
                    </div>
                </div>
            </div>`);
        
        document.querySelector("#es_calc_size").addEventListener("click", async () => {
            ExtensionLayer.runInPageContext((calculating, totalSize) => {
                ShowBlockingWaitDialog(calculating, totalSize);
            },
            [
                Localization.str.calc_workshop_size.calculating,
                Localization.str.calc_workshop_size.total_size.replace("__size__", "0 KB"),
            ]);

            let totalStr = document.querySelector(".workshopBrowsePagingInfo").innerText.match(/\d+[,\d]*/g).pop();
            let total = Number(totalStr.replace(/,/g, ""));
            let parser = new DOMParser();
            let totalSize = 0;

            for (let p = 1; p <= Math.ceil(total / 30); p++) {
                url.searchParams.set("p", p);
                url.searchParams.set("numperpage", 30);

                let result = await RequestData.getHttp(url.toString()).catch(err => console.error(err));
                if (!result) {
                    console.error("Failed to request " + url.toString());
                    continue;
                }

                let doc = parser.parseFromString(result, "text/html");
                for (let item of doc.querySelectorAll(".workshopItemSubscription[id*=Subscription]")) {
                    let id = item.id.replace("Subscription", "");
                    let size;

                    try {
                        size = await Background.action("workshopfilesize", id);
                    } catch(err) {
                        console.group("Workshop file sizes");
                        console.error(`Couldn't get file size for item ID ${id}`);
                        console.error(err);
                        console.groupEnd();
                    }
    
                    if (!size) { continue; }

                    totalSize += size;
                    
                    ExtensionLayer.runInPageContext((calculating, totalSize) => {
                        CModal.DismissActiveModal();
                        ShowBlockingWaitDialog(calculating, totalSize);
                    },
                    [
                        Localization.str.calc_workshop_size.calculating,
                        Localization.str.calc_workshop_size.total_size.replace("__size__", MyWorkshopClass.getFileSizeStr(totalSize)),
                    ]);
                }
            }

            MyWorkshopClass.addFileSizes();
            ExtensionLayer.runInPageContext((finished, totalSize) => {
                CModal.DismissActiveModal();
                ShowAlertDialog(finished, totalSize);
            },
            [
                Localization.str.calc_workshop_size.finished,
                Localization.str.calc_workshop_size.total_size.replace("__size__", MyWorkshopClass.getFileSizeStr(totalSize)),
            ]);
        });
    };
}

class SharedFilesPageClass {
    constructor() {
        new MediaPage().workshopPage();
        //media.initHdPlayer();
    }
}

let WorkshopBrowseClass = (function(){

    function WorkshopBrowseClass() {
        this.addSubscriberButtons();
    }

    WorkshopBrowseClass.prototype.addSubscriberButtons = function() {
        if (!User.isSignedIn) { return; }

        let appid = GameId.getAppidUriQuery(window.location.search);
        if (!appid) { return; }

        let pagingInfo = document.querySelector(".workshopBrowsePagingInfo");
        if (!pagingInfo) { return; }

        let workshopStr = Localization.str.workshop;

        HTML.beforeBegin(".panel > .rightSectionTopTitle",
            `<div class="rightSectionTopTitle">${workshopStr.subscriptions}:</div>
            <div id="es_subscriber_container" class="rightDetailsBlock">
                <div style="position: relative;">
                    <div class="browseOption mostrecent">
                        <a class="es_subscriber" data-method="subscribe">${workshopStr.subscribe_all}</a>
                    </div>
                </div>
                <div style="position: relative;">
                    <div class="browseOption mostrecent">
                        <a class="es_subscriber" data-method="unsubscribe">${workshopStr.unsubscribe_all}</a>
                    </div>
                </div>
                <hr>
            </div>`);

        document.querySelector("#es_subscriber_container").addEventListener("click", e => {
            let method = e.target.closest(".es_subscriber").dataset.method;
            let total = Math.max(...pagingInfo.textContent.replace(/,/g, "").match(/\d+/g));

            startSubscriber(method, total);
        });

        async function startSubscriber(method, total) {
            let completed = 0;
            let failed = 0;

            let statusTitle = workshopStr[method + "_all"];
            let statusString = workshopStr[method + "_confirm"]
                .replace("__count__", total);

            function updateWaitDialog() {
                let statusString = workshopStr[method + "_loading"]
                    .replace("__i__", completed)
                    .replace("__count__", total);

                if (failed) {
                    statusString += workshopStr.failed.replace("__n__", failed);
                }

                let modal = document.querySelector(".newmodal_content");
                if (!modal) {
                    let statusTitle = workshopStr[method + "_all"];
                    ExtensionLayer.runInPageContext((title, progress) => {
                        if (window.dialog) {
                            window.dialog.Dismiss();
                        }
                        
                        window.dialog = ShowBlockingWaitDialog(title, progress);
                    }, [ statusTitle, statusString ]);
                } else {
                    modal.innerText = statusString;
                }
            }

            function showResults() {
                let statusTitle = workshopStr[method + "_all"];
                let statusString = workshopStr.finished
                    .replace("__success__", completed - failed)
                    .replace("__fail__", failed);

                ExtensionLayer.runInPageContext((title, finished) => {
                    if (window.dialog) {
                        window.dialog.Dismiss();
                    }
                    
                    window.dialog = ShowConfirmDialog(title, finished)
                        .done(result => {
                            if (result === "OK") {
                                window.location.reload();
                            }
                        });
                }, [ statusTitle, statusString ]);
            }

            function changeSubscription(id) {
                let formData = new FormData();
                formData.append("sessionid", User.getSessionId());
                formData.append("appid", appid);
                formData.append("id", id);

                return RequestData.post("https://steamcommunity.com/sharedfiles/" + method, formData, {
                    withCredentials: true
                }, true)
                .then(function(res) {
                    if (!res || !res.success) {
                        throw new Error("Bad response");
                    }
                })
                .catch(function(err) {
                    failed++;
                    console.error(err);
                })
                .finally(function() {
                    completed++;
                    updateWaitDialog();
                });
            }

            // todo reject when dialog closed
            await ExtensionLayer.runInPageContext((title, confirm) => {
                let prompt = ShowConfirmDialog(title, confirm);

                return new Promise(resolve => {
                    prompt.done(result => {
                        if (result === "OK") {
                            resolve();
                        }
                    });
                });
                
            }, [ statusTitle, statusString ], "startSubscriber");

            updateWaitDialog();

            function canSkip(method, node) {
                if (method === "subscribe") {
                    return node && node.style.display !== "none";
                }

                if (method === "unsubscribe") {
                    return !node || node.style.display === "none";
                }

                return false;
            }

            let parser = new DOMParser();
            let workshopItems = [];
            for (let p = 1; p <= Math.ceil(total / 30); p++) {
                let url = new URL(window.location.href);
                url.searchParams.set("p", p);
                url.searchParams.set("numperpage", 30);

                let result = await RequestData.getHttp(url.toString()).catch(err => console.error(err));
                if (!result) {
                    console.error("Failed to request " + url.toString());
                    continue;
                }

                let xmlDoc = parser.parseFromString(result, "text/html");
                for (let node of xmlDoc.querySelectorAll(".workshopItem")) {
                    let subNode = node.querySelector(".user_action_history_icon.subscribed");
                    if (canSkip(method, subNode)) { continue; }
                
                    node = node.querySelector(".workshopItemPreviewHolder");
                    workshopItems.push(node.id.replace("sharedfile_", ""))
                }
            }

            total = workshopItems.length;
            updateWaitDialog();

            return Promise.all(workshopItems.map(id => changeSubscription(id)))
                .finally(showResults);
        }
    };

    return WorkshopBrowseClass;
})();

let EditGuidePageClass = (function(){

    function EditGuidePageClass() {
        this.allowMultipleLanguages();
        this.addCustomTags();
        this.rememberTags();
    }

    function addTag(name, checked=true) {
        name = HTML.escape(name);
        let attr = checked ? " checked" : "";
        let tag = `<div><input type="checkbox" name="tags[]" value="${name}" class="inputTagsFilter"${attr}>${name}</div>`;
        HTML.beforeBegin("#es_add_tag", tag);
    }

    EditGuidePageClass.prototype.allowMultipleLanguages = function() {
        document.getElementsByName("tags[]").forEach(tag => tag.type = "checkbox");
    };

    EditGuidePageClass.prototype.addCustomTags = function() {
        let langSection = document.querySelector("#checkboxgroup_1");
        if (!langSection) { return; }

        Messenger.addMessageListener("addtag", name => {
            addTag(name, true);
        });
        
        HTML.afterEnd(langSection,
            `<div class="tag_category_container" id="checkboxgroup_2">
                <div class="tag_category_desc">${Localization.str.custom_tags}</div>
                <div><a style="margin-top: 8px;" class="btn_blue_white_innerfade btn_small_thin" id="es_add_tag">
                    <span>${Localization.str.add_tag}</span>
                </a></div>
            </div>`);

        ExtensionLayer.runInPageContext((customTags, enterTag) => {
            $J("#es_add_tag").on("click", () => {
                let Modal = ShowConfirmDialog(customTags, 
                    `<div class="commentthread_entry_quotebox">
                        <textarea placeholder="${enterTag}" class="commentthread_textarea es_tag" rows="1"></textarea>
                    </div>`);
                
                let elem = $J(".es_tag");
                let tag = elem.val();

                function done() {
                    if (tag.trim().length === 0) { return; }
                    tag = tag[0].toUpperCase() + tag.slice(1);
                    Messenger.postMessage("addtag", tag);
                }

                elem.on("keydown paste input", e => {
                    tag = elem.val();
                    if (e.key === "Enter") {
                        Modal.Dismiss();
                        done();
                    }
                });

                Modal.done(done);
            });
        }, [ Localization.str.custom_tags, Localization.str.enter_tag ]);
    };

    EditGuidePageClass.prototype.rememberTags = function() {
        let submitBtn = document.querySelector("[href*=SubmitGuide]");
        if (!submitBtn) { return; }

        let params = new URLSearchParams(window.location.search);
        let curId = params.get("id") || "recent";
        let savedTags = LocalStorage.get("es_guide_tags", {});
        if (!savedTags[curId]) {
            savedTags[curId] = savedTags.recent || [];
        }

        for (let id in savedTags) {
            for (let tag of savedTags[id]) {
                let node = document.querySelector(`[name="tags[]"][value="${tag.replace(/"/g, "\\\"")}"]`);
                if (node && curId == id) {
                    node.checked = true;
                } else if (!node) {
                    addTag(tag, curId == id);
                }
            }
        }

        submitBtn.removeAttribute("href");
        submitBtn.addEventListener("click", function() {
            savedTags.recent = [];
            savedTags[curId] = Array.from(document.querySelectorAll("[name='tags[]']:checked")).map(node => node.value);
            LocalStorage.set("es_guide_tags", savedTags);
            ExtensionLayer.runInPageContext(() => { SubmitGuide(); });
        });
    };

    return EditGuidePageClass;
})();

(async function(){
    
    switch (true) {

        case /^\/(?:id|profiles)\/.+\/friends(?:[/#?]|$)/.test(path):
            (new FriendsPageClass());
            break;

        case /^\/(?:id|profiles)\/.+\/groups(?:[/#?]|$)/.test(path):
            (new GroupsPageClass());
            break;

        case /^\/(?:id|profiles)\/.+\/inventory/.test(path):
            (new InventoryPageClass());
            break;

        case /^\/market\/listings\/.*/.test(path):
            (new MarketListingPageClass());
            break;

        case /^\/market\/.*/.test(path):
            (new MarketPageClass());
            break;

        case /^\/(?:id|profiles)\/[^\/]+?\/?$/.test(path):
            (new ProfileHomePageClass());
            break;

        case /^\/groups\/[^\/]+\/?$/.test(path):
            (new GroupHomePageClass());
            break;

        case /^\/app\/[^\/]*\/guides/.test(path):
            (new GuidesPageClass());
            break;

        case /^\/app\/.*/.test(path):
            (new CommunityAppPageClass());
            break;

        case /^\/(?:id|profiles)\/.+\/stats/.test(path):
            (new StatsPageClass());
            break;

        case /^\/(?:id|profiles)\/.+\/myworkshopfiles\/?$/.test(path):
            (new MyWorkshopClass());
            break;

        case /^\/sharedfiles\/filedetails\/?$/.test(path):
            (new SharedFilesPageClass());
            break;

        case /^\/workshop\/browse/.test(path):
            (new WorkshopBrowseClass());
            break;

        case /^\/sharedfiles\/editguide\/?$/.test(path):
            (new EditGuidePageClass());
            break;

        case /^\/(?:id|profiles)\/.+\/recommended/.test(path):
            (new RecommendedPageClass());
            break;

        case /^\/tradingcards\/boostercreator/.test(path):
            ExtensionLayer.runInPageContext(gemWord => {
                $J("#booster_game_selector option").each(function() {
                    if ($J(this).val()) {
                        $J(this).append(` - ${CBoosterCreatorPage.sm_rgBoosterData[$J(this).val()].price} ${gemWord}`);
                    }
                });
            }, [ document.querySelector(".booster_creator_goostatus .goo_display").textContent.trim().replace(/[\d]+,?/g, "") ]);
            break;
    }
})();
