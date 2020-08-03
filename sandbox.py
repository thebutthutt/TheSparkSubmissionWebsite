import os
import sys
import getpass
import ldap

def authenticate(user, pwrd):
    '''
    Input a user name and password and retrun
    if it authenticates against the UNT Auth Tree
    '''

    #bind attempts will need the full Distinguished Name for the user.
    #this is generally the user with the hierarchy of the directory
    userDN = "uid=" + str(user) + ",ou=people,o=unt"

    #set some tuneables for the LDAP library.
    ldap.set_option(ldap.OPT_X_TLS_REQUIRE_CERT, ldap.OPT_X_TLS_ALLOW)
    #ldap.set_option(ldap.OPT_X_TLS_CACERTFILE, CACERTFILE)
    
    #set up your connection
    conn = ldap.initialize('ldaps://ldap-auth.untsystem.edu')
    conn.protocol_version = 3 
    conn.set_option(ldap.OPT_REFERRALS, 0) 

    #attempt to bind to the server with the username and password provided
    #if the server does not signal Invalid Credentials, your authentication
    #of the supplied username and password should be successful.
    try:
        result = conn.simple_bind_s(userDN, pwrd)
        return "Authentication successful" 
    except ldap.INVALID_CREDENTIALS:
        result = "Invalid credentials for %s" % user
        return(result)

def aboutuser(user):
    '''
    Input a user name and search the directory
    '''
    #build query in the form of (uid=user)
    user_query = '(uid=' + user + ')'

    #set some tuneables for the LDAP library.
    ldap.set_option(ldap.OPT_X_TLS_REQUIRE_CERT, ldap.OPT_X_TLS_ALLOW)
    #ldap.set_option(ldap.OPT_X_TLS_CACERTFILE, CACERTFILE)
    
    #set up your connection
    conn = ldap.initialize('ldaps://ldap-auth.untsystem.edu')
    conn.protocol_version = 3
    conn.set_option(ldap.OPT_REFERRALS, 0)

    user_info = conn.search_s('ou=people,o=unt', ldap.SCOPE_SUBTREE, filterstr=user_query)
    return(user_info)

# ---------------------
#Authenticating the user
print("username: ")
user = input()
user = str(user)

passwd = getpass.getpass()
passwd = str(passwd)

auth_result = authenticate(user, passwd)
print(auth_result)

# ---------------------
# we can also search the directory for the user.  While there's not a lot of information 
# available in the Auth tree, you could use such a query to populate first and last name.
user_info_result = aboutuser(user)
print("LDAP record object")
print(user_info_result)
