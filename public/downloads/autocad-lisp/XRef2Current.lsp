;;----------------------------------------------------------------------;;
;; Program: XRef to Current Drawing                                    ;;
;; Filename: XRef2Current.lsp                                          ;;
;; Command: X2C                                                        ;;
;; Version: 1.0                                                        ;;
;; Author: Ivaneiko Volodymyr                                          ;;
;; Copyright (c) 2026 Ivaneiko Volodymyr. All rights reserved.         ;;
;;                                                                      ;;
;; Proprietary license: free use is permitted in personal and          ;;
;; commercial projects. Resale, public republication without written  ;;
;; permission, and distribution of modified versions under the         ;;
;; original name are prohibited.                                       ;;
;;                                                                      ;;
;; This software is provided "as is", without warranty of any kind.    ;;
;; The user is solely responsible for the results of its use.           ;;
;;----------------------------------------------------------------------;;
;;----------------------=={ XRef to Current Drawing }==--------------------;;
;; Command: X2C
;;
;; Copies selected nested objects from a selected Xref into the current
;; drawing, preserving their displayed position, scale and rotation.
;;
;; At the end, asks whether to delete copied objects from the Xref source DWG.
;;----------------------------------------------------------------------;;

(defun c:x2c ( / *error* acd app dbx def doc dwg dwl ent enx err hand
                 mat obj res sel spc src srcobj tmp xrf xrl cnt del hnd
                 ans delcnt opendbx saveres reloadres )

    (vl-load-com)

    (defun *error* ( msg )
        (if (and (= 'vla-object (type dbx))
                 (not (vlax-object-released-p dbx))
            )
            (vlax-release-object dbx)
        )
        (if (not (wcmatch (strcase msg t) "*break,*cancel*,*exit*"))
            (princ (strcat "\nError: " msg))
        )
        (princ)
    )

    ;; Convert CopyObjects result to a plain list of VLA objects
    (defun X2C:objectlist ( x )
        (cond
            (   (null x) nil )
            (   (vl-catch-all-error-p x) nil )
            (   (= 'variant (type x))
                (X2C:objectlist (vlax-variant-value x))
            )
            (   (= 'safearray (type x))
                (vlax-safearray->list x)
            )
            (   (= 'vla-object (type x))
                (list x)
            )
            (   (listp x) x )
        )
    )

    ;; Checks whether nested selection path contains selected Xref insert
    (defun X2C:inside-xref-p ( path xrf / e enx ok )
        (foreach e path
            (if
                (and
                    (= 'ename (type e))
                    (setq enx (entget e))
                    (= "INSERT" (cdr (assoc 0 enx)))
                    (= (strcase xrf) (strcase (cdr (assoc 2 enx))))
                )
                (setq ok T)
            )
        )
        ok
    )

    ;; Select Xref insert
    (defun X2C:select-xref ( xrl / ent enx )
        (while
            (progn
                (setvar 'errno 0)
                (setq ent (car (entsel "\nSelect source Xref: ")))
                (cond
                    (   (= 7 (getvar 'errno))
                        (princ "\nMissed, try again.")
                    )
                    (   (= 'ename (type ent))
                        (if
                            (or
                                (/= "INSERT" (cdr (assoc 0 (setq enx (entget ent)))))
                                (not (member (cdr (assoc 2 enx)) xrl))
                            )
                            (progn
                                (princ "\nSelected object is not an Xref.")
                                T
                            )
                        )
                    )
                )
            )
        )
        ent
    )

    ;; Build list of Xref block names
    (while (setq def (tblnext "block" (null def)))
        (if (= 4 (logand 4 (cdr (assoc 70 def))))
            (setq xrl (cons (cdr (assoc 2 def)) xrl))
        )
    )

    (cond
        (   (null xrl)
            (princ "\nNo Xrefs found in this drawing.")
        )

        (   (not (setq ent (X2C:select-xref xrl)))
            (princ "\nNothing selected.")
        )

        (   (not
                (and
                    (setq enx (entget ent))
                    (setq xrf (cdr (assoc 2 enx)))
                    (setq dwg (cdr (assoc 1 (tblsearch "block" xrf))))
                    (setq dwg (findfile dwg))
                )
            )
            (princ "\nUnable to locate Xref source drawing.")
        )

        (   T
            (setq app (vlax-get-acad-object)
                  acd (vla-get-activedocument app)
            )

            ;; Current target space
            (setq spc
                (if (= 1 (getvar 'cvport))
                    (vla-get-paperspace acd)
                    (vla-get-modelspace acd)
                )
            )

            ;; If source drawing is already open, use it.
            ;; Otherwise open it through ObjectDBX.
            (vlax-for doc (vla-get-documents app)
                (setq dwl (cons (cons (strcase (vla-get-fullname doc)) doc) dwl))
            )

            (cond
                (   (setq src (cdr (assoc (strcase dwg) dwl))) )

                (   (progn
                        (setq dbx
                            (vl-catch-all-apply
                                'vla-getinterfaceobject
                                (list app
                                    (if (< (atoi (getvar 'acadver)) 16)
                                        "objectdbx.axdbdocument"
                                        (strcat "objectdbx.axdbdocument." (itoa (atoi (getvar 'acadver))))
                                    )
                                )
                            )
                        )
                        (or (null dbx) (vl-catch-all-error-p dbx))
                    )
                    (princ "\nUnable to interface with ObjectDBX.")
                )

                (   (vl-catch-all-error-p
                        (setq err
                            (vl-catch-all-apply 'vla-open (list dbx dwg))
                        )
                    )
                    (princ
                        (strcat
                            "\nUnable to open Xref source drawing:\n"
                            (vl-catch-all-error-message err)
                        )
                    )
                )

                (   T
                    (setq src dbx)
                    (setq opendbx T)
                )
            )

            (if src
                (progn
                    (setq cnt 0)
                    (setq del nil)
                    (setq hnd nil)

                    (princ
                        (strcat
                            "\nPick objects inside Xref \""
                            xrf
                            "\". Press Enter when finished."
                        )
                    )

                    (while
                        (setq sel
                            (nentselp
                                "\nSelect object inside selected Xref <Enter to finish>: "
                            )
                        )
                        (setq tmp  (car sel)
                              mat  (caddr sel)
                              hand (cdr (assoc 5 (entget tmp)))
                        )

                        (cond
                            (   (not (X2C:inside-xref-p (cadddr sel) xrf))
                                (princ "\nSelected object is not inside the selected Xref.")
                            )

                            (   (null hand)
                                (princ "\nUnable to read source object handle.")
                            )

                            (   (vl-catch-all-error-p
                                    (setq srcobj
                                        (vl-catch-all-apply
                                            'vla-handletoobject
                                            (list src hand)
                                        )
                                    )
                                )
                                (princ "\nUnable to find this object in the Xref source drawing.")
                            )

                            (   (vl-catch-all-error-p
                                    (setq res
                                        (vl-catch-all-apply
                                            'vlax-invoke
                                            (list src 'copyobjects (list srcobj) spc)
                                        )
                                    )
                                )
                                (princ "\nUnable to copy this object.")
                            )

                            (   T
                                ;; Transform copied object to the same visual position
                                ;; as it had through the Xref insertion.
                                (foreach obj (X2C:objectlist res)
                                    (vla-transformby obj (vlax-tmatrix mat))
                                )

                                ;; Save unique source objects for optional deletion.
                                (if (not (member (strcase hand) hnd))
                                    (setq hnd (cons (strcase hand) hnd)
                                          del (cons srcobj del)
                                    )
                                )

                                (setq cnt (1+ cnt))
                            )
                        )
                    )

                    (princ
                        (strcat
                            "\nCopied objects from Xref: "
                            (itoa cnt)
                        )
                    )

                    ;; Ask whether to delete copied source objects from Xref
                    (if (> cnt 0)
                        (progn
                            (initget "Yes No")
                            (setq ans
                                (getkword
                                    "\nDelete selected objects from Xref source drawing? [Yes/No] <No>: "
                                )
                            )

                            (if (= ans "Yes")
                                (progn
                                    (setq delcnt 0)

                                    (foreach obj del
                                        (if
                                            (not
                                                (vl-catch-all-error-p
                                                    (setq err
                                                        (vl-catch-all-apply
                                                            'vla-delete
                                                            (list obj)
                                                        )
                                                    )
                                                )
                                            )
                                            (setq delcnt (1+ delcnt))
                                            (princ
                                                (strcat
                                                    "\nUnable to delete object: "
                                                    (vl-catch-all-error-message err)
                                                )
                                            )
                                        )
                                    )

                                    (if (> delcnt 0)
                                        (progn
                                            ;; Save Xref source drawing
                                            (setq saveres
                                                (if opendbx
                                                    (vl-catch-all-apply 'vla-saveas (list src dwg))
                                                    (vl-catch-all-apply 'vla-save   (list src))
                                                )
                                            )

                                            (if (vl-catch-all-error-p saveres)
                                                (princ
                                                    (strcat
                                                        "\nObjects were deleted in session, but Xref source drawing could not be saved:\n"
                                                        (vl-catch-all-error-message saveres)
                                                    )
                                                )
                                                (progn
                                                    ;; Reload Xref in current drawing
                                                    (setq reloadres
                                                        (vl-catch-all-apply
                                                            'vla-reload
                                                            (list
                                                                (vla-item
                                                                    (vla-get-blocks acd)
                                                                    xrf
                                                                )
                                                            )
                                                        )
                                                    )

                                                    (if (vl-catch-all-error-p reloadres)
                                                        (princ
                                                            (strcat
                                                                "\nXref was saved, but could not be reloaded:\n"
                                                                (vl-catch-all-error-message reloadres)
                                                            )
                                                        )
                                                        (princ "\nXref source drawing saved and reloaded.")
                                                    )

                                                    (princ
                                                        (strcat
                                                            "\nDeleted objects from Xref: "
                                                            (itoa delcnt)
                                                        )
                                                    )
                                                )
                                            )
                                        )
                                        (princ "\nNo objects were deleted from Xref.")
                                    )
                                )
                                (princ "\nObjects in Xref were not deleted.")
                            )
                        )
                    )
                )
            )
        )
    )

    (if (and (= 'vla-object (type dbx))
             (not (vlax-object-released-p dbx))
        )
        (vlax-release-object dbx)
    )

    (princ)
)

(princ "\n:: XRef2Current.lsp loaded. Type X2C to run. ::")
(princ)